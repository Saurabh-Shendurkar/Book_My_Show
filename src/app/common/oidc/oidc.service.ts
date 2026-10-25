import "dotenv/config";
import jose from "node-jose";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import { PUBLIC_KEY, PRIVATE_KEY } from "../utils/cert";
import { ApiError } from "../utils/api.error";
import { db } from "../config/db";
import {
  applicationsTable,
  clientsTable,
  applicationSubscriptionsTable,
} from "../../module/oidc_client/client.schema";
import { usersTable } from "../../module/auth/auth.schema";
import { eq, and } from "drizzle-orm";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  type userPayload,
} from "../utils/jwt.utils";
import type { AuthorizeRequest } from "./dto/authorize.dto";
import type { TokenRequest } from "./dto/token.dto";

const getDomain = () => {
  return (
    process.env.DOMAIN || `http://localhost:${process.env.PORT || 5000}`
  ).replace(/\/$/, "");
};

let cachedKid: string | null = null;
const getKeyId = async (): Promise<string> => {
  if (cachedKid) return cachedKid;
  const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
  cachedKid = key.kid;
  return key.kid;
};

const oidcConfig = async () => {
  const domain = getDomain();

  return {
    issuer: domain,
    authorization_endpoint: `${domain}/oauth/authorize`,
    token_endpoint: `${domain}/oauth/token`,
    userinfo_endpoint: `${domain}/oauth/userinfo`,
    end_session_endpoint: `${domain}/api/auth/logout`,
    revocation_endpoint: `${domain}/oauth/revoke`,
    registration_endpoint: `${domain}/api/client/app`,
    jwks_uri: `${domain}/.well-known/jwks.json`,
    response_types_supported: ["code", "token", "id_token", "code id_token"],
    response_modes_supported: ["query", "fragment"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email", "phone", "offline_access"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
    ],
    claims_supported: [
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "auth_time",
      "nonce",
      "email",
      "email_verified",
      "name",
      "given_name",
      "family_name",
      "phone_number",
    ],
    code_challenge_methods_supported: ["S256", "plain"],
  };
};

const jwks = async () => {
  const keystore = jose.JWK.createKeyStore();
  await keystore.add(PUBLIC_KEY, "pem", { alg: "RS256", use: "sig" });
  return keystore.toJSON();
};

const getApplicationForAuthorize = async (clientId: string, redirectUri: string) => {
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.clientAppId, clientId));

  if (!app) {
    throw ApiError.badRequest("Invalid client_id: Application does not exist");
  }

  // Exact match on redirect_uri
  if (app.redirectUrl.replace(/\/$/, "") !== redirectUri.replace(/\/$/, "")) {
    throw ApiError.badRequest(
      `Mismatch redirect_uri`
    );
  }

  return app;
};

const authorize = async (params: AuthorizeRequest, userId: string) => {
  const app = await getApplicationForAuthorize(params.client_id, params.redirect_uri);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) throw ApiError.notFound("User not found");
  if (!user.isEmailverified) throw ApiError.forbidden("User email is not verified");

  // Generate secure authorization code
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Record/update subscription
  const [existingSubscription] = await db
    .select()
    .from(applicationSubscriptionsTable)
    .where(
      and(
        eq(applicationSubscriptionsTable.applicationId, app.clientAppId),
        eq(applicationSubscriptionsTable.userId, user.id)
      )
    );

  if (existingSubscription) {
    await db
      .update(applicationSubscriptionsTable)
      .set({
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
        redirectUri: params.redirect_uri,
        scope: params.scope,
        nonce: params.nonce || null,
        codeChallenge: params.code_challenge || null,
        codeChallengeMethod: params.code_challenge_method || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applicationSubscriptionsTable.applicationId, app.clientAppId),
          eq(applicationSubscriptionsTable.userId, user.id)
        )
      );
  } else {
    await db.insert(applicationSubscriptionsTable).values({
      applicationId: app.clientAppId,
      userId: user.id,
      verificationCode: code,
      verificationCodeExpiresAt: expiresAt,
      redirectUri: params.redirect_uri,
      scope: params.scope,
      nonce: params.nonce || null,
      codeChallenge: params.code_challenge || null,
      codeChallengeMethod: params.code_challenge_method || null,
    });
  }

  const redirectUrl = new URL(params.redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (params.state) {
    redirectUrl.searchParams.set("state", params.state);
  }

  return { redirectUrl: redirectUrl.toString(), code };
};

const verifyClientCredentials = async (clientId: string, clientSecret: string) => {
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.clientAppId, clientId));

  if (!app) {
    throw ApiError.unAuthorized("Invalid client credentials: Application not found");
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clientId, app.clientId));

  if (!client || !client.clientSecret) {
    throw ApiError.unAuthorized("Invalid client credentials: Secret not configured");
  }

  const hashedSecret = crypto.createHash("sha256").update(clientSecret).digest();
  const storedSecretBuffer = Buffer.isBuffer(client.clientSecret)
    ? client.clientSecret
    : Buffer.from(client.clientSecret);

  if (hashedSecret.length !== storedSecretBuffer.length) {
    throw ApiError.unAuthorized("Invalid client credentials");
  }

  const isValid = crypto.timingSafeEqual(hashedSecret, storedSecretBuffer);
  if (!isValid) {
    throw ApiError.unAuthorized("Invalid client credentials");
  }

  return { app, client };
};

const exchangeToken = async (
  params: TokenRequest,
  clientCredentials: { clientId: string; clientSecret: string }
) => {
  if (params.grant_type === "refresh_token") {
    return refreshToken(params, clientCredentials);
  }

  if (params.grant_type !== "authorization_code") {
    throw ApiError.badRequest(`Unsupported grant_type: '${params.grant_type}'`);
  }

  if (!params.code) {
    throw ApiError.badRequest("Missing required parameter: 'code'");
  }

  const { app } = await verifyClientCredentials(
    clientCredentials.clientId,
    clientCredentials.clientSecret
  );

  // Find subscription by applicationId and verificationCode
  const [subscription] = await db
    .select()
    .from(applicationSubscriptionsTable)
    .where(
      and(
        eq(applicationSubscriptionsTable.applicationId, app.clientAppId),
        eq(applicationSubscriptionsTable.verificationCode, params.code)
      )
    );

  if (!subscription) {
    throw ApiError.badRequest("Invalid authorization code");
  }

  if (
    subscription.verificationCodeExpiresAt &&
    subscription.verificationCodeExpiresAt < new Date()
  ) {
    throw ApiError.badRequest("Authorization code has expired");
  }

  if (params.redirect_uri && subscription.redirectUri) {
    if (params.redirect_uri.replace(/\/$/, "") !== subscription.redirectUri.replace(/\/$/, "")) {
      throw ApiError.badRequest("redirect_uri mismatch with authorization request");
    }
  }

  // PKCE verification
  if (subscription.codeChallenge) {
    if (!params.code_verifier) {
      throw ApiError.badRequest("code_verifier required for PKCE");
    }

    if (subscription.codeChallengeMethod === "S256") {
      const computedChallenge = crypto
        .createHash("sha256")
        .update(params.code_verifier)
        .digest("base64url");

      if (computedChallenge !== subscription.codeChallenge) {
        throw ApiError.badRequest("PKCE verification failed: invalid code_verifier");
      }
    } else {
      if (params.code_verifier !== subscription.codeChallenge) {
        throw ApiError.badRequest("PKCE verification failed: invalid code_verifier");
      }
    }
  }

  // Invalidate authorization code (single use)
  await db
    .update(applicationSubscriptionsTable)
    .set({
      verificationCode: null,
      verificationCodeExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(applicationSubscriptionsTable.applicationId, app.clientAppId),
        eq(applicationSubscriptionsTable.userId, subscription.userId)
      )
    );

  // Fetch User
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, subscription.userId));

  if (!user) throw ApiError.notFound("User no longer exists");

  const domain = getDomain();
  const kid = await getKeyId();

  // Access Token & Refresh Token
  const access_token = createAccessToken({ id: user.id });
  const refresh_token = createRefreshToken({ id: user.id });

  // Update refresh token for user
  await db
    .update(usersTable)
    .set({ refreshToken: refresh_token })
    .where(eq(usersTable.id, user.id));

  // Generate standard OIDC ID Token signed with RSA private key (RS256)
  const now = Math.floor(Date.now() / 1000);
  const idTokenPayload: Record<string, any> = {
    iss: domain,
    sub: user.id,
    aud: app.clientAppId,
    exp: now + 3600, // 1 hour
    iat: now,
    auth_time: now,
    email: user.email,
    email_verified: user.isEmailverified,
    name: `${user.firstName} ${user.lastName || ""}`.trim(),
    given_name: user.firstName,
    family_name: user.lastName || undefined,
    phone_number: user.phoneNo || undefined,
  };

  if (subscription.nonce) {
    idTokenPayload.nonce = subscription.nonce;
  }

  const id_token = jwt.sign(idTokenPayload, PRIVATE_KEY, {
    algorithm: "RS256",
    keyid: kid,
  });

  return {
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token,
    id_token,
    scope: subscription.scope || "openid profile email",
  };
};

const refreshToken = async (
  params: TokenRequest,
  clientCredentials: { clientId: string; clientSecret: string }
) => {
  if (!params.refresh_token) {
    throw ApiError.badRequest("Missing required parameter: 'refresh_token'");
  }

  const { app } = await verifyClientCredentials(
    clientCredentials.clientId,
    clientCredentials.clientSecret
  );

  let decoded: userPayload;
  try {
    decoded = verifyRefreshToken(params.refresh_token) as userPayload;
  } catch (err) {
    throw ApiError.unAuthorized("Invalid or expired refresh token");
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, decoded.id));

  if (!user) throw ApiError.unAuthorized("User not found");
  if (user.refreshToken !== params.refresh_token) {
    throw ApiError.unAuthorized("Refresh token has been revoked or already rotated");
  }

  const domain = getDomain();
  const kid = await getKeyId();

  const newAccessToken = createAccessToken({ id: user.id });
  const newRefreshToken = createRefreshToken({ id: user.id });

  await db
    .update(usersTable)
    .set({ refreshToken: newRefreshToken })
    .where(eq(usersTable.id, user.id));

  const now = Math.floor(Date.now() / 1000);
  const idTokenPayload = {
    iss: domain,
    sub: user.id,
    aud: app.clientAppId,
    exp: now + 3600,
    iat: now,
    auth_time: now,
    email: user.email,
    email_verified: user.isEmailverified,
    name: `${user.firstName} ${user.lastName || ""}`.trim(),
    given_name: user.firstName,
    family_name: user.lastName || undefined,
    phone_number: user.phoneNo || undefined,
  };

  const id_token = jwt.sign(idTokenPayload, PRIVATE_KEY, {
    algorithm: "RS256",
    keyid: kid,
  });

  return {
    access_token: newAccessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: newRefreshToken,
    id_token,
    scope: "openid profile email",
  };
};

const getUserInfo = async (userId: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) throw ApiError.notFound("User not found");

  return {
    sub: user.id,
    email: user.email,
    email_verified: user.isEmailverified,
    name: `${user.firstName} ${user.lastName || ""}`.trim(),
    given_name: user.firstName,
    family_name: user.lastName || undefined,
    phone_number: user.phoneNo || undefined,
  };
};

const revokeToken = async (
  token: string,
  clientCredentials?: { clientId: string; clientSecret: string }
) => {
  if (clientCredentials?.clientId && clientCredentials?.clientSecret) {
    await verifyClientCredentials(
      clientCredentials.clientId,
      clientCredentials.clientSecret
    );
  }

  // If token is a refresh token for user, invalidate it
  await db
    .update(usersTable)
    .set({ refreshToken: null })
    .where(eq(usersTable.refreshToken, token));

  return true;
};

export {
  oidcConfig,
  jwks,
  getApplicationForAuthorize,
  authorize,
  verifyClientCredentials,
  exchangeToken,
  refreshToken,
  getUserInfo,
  revokeToken,
};

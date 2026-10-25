import type { Request, Response } from "express";
import {
  oidcConfig,
  jwks,
  getApplicationForAuthorize,
  authorize,
  exchangeToken,
  getUserInfo,
  revokeToken,
} from "./oidc.service";
import { renderConsentPage } from "./oidc.template";
import { ApiError } from "../utils/api.error";
import { db } from "../config/db";
import { usersTable } from "../../module/auth/auth.schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { AuthorizeRequest } from "./dto/authorize.dto";
import type { TokenRequest } from "./dto/token.dto";
import type { RevokeRequest } from "./dto/revoke.dto";

// OpenID Connect Discovery
const oidcHandler = async (_: Request, res: Response) => {
  const response = await oidcConfig();
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(response);
};

// JWKS Endpoint
const jwksHandler = async (_: Request, res: Response) => {
  const jwksResponse = await jwks();
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(jwksResponse);
};

// Helper to extract HTTP Basic Auth credentials
const extractClientCredentials = (
  req: Request
): { clientId: string; clientSecret: string } => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Basic ")) {
    const base64Credentials = authHeader.split(" ")[1];
    if (base64Credentials) {
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [clientId, ...secretParts] = credentials.split(":");
      const clientSecret = secretParts.join(":");
      if (clientId && clientSecret) {
        return { clientId, clientSecret };
      }
    }
  }

  const clientId = req.body?.client_id || (req.query?.client_id as string);
  const clientSecret = req.body?.client_secret || (req.query?.client_secret as string);

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  throw ApiError.unAuthorized("Missing client credentials (provide Basic Auth or client_id/client_secret in body)");
};

// Authorization Endpoint (GET and POST)
const authorizeHandler = async (req: Request, res: Response) => {
  const query = req.query || {};
  const body = req.body || {};

  const params: AuthorizeRequest = {
    client_id: (query.client_id || body.client_id) as string,
    redirect_uri: (query.redirect_uri || body.redirect_uri) as string,
    response_type: (query.response_type || body.response_type || "code") as string,
    scope: (query.scope || body.scope || "openid profile email") as string,
    state: (query.state || body.state) as string | undefined,
    nonce: (query.nonce || body.nonce) as string | undefined,
    code_challenge: (query.code_challenge || body.code_challenge) as string | undefined,
    code_challenge_method: (query.code_challenge_method || body.code_challenge_method) as any,
    email: body.email,
    password: body.password,
    consent: body.consent,
  };

  if (!params.client_id) throw ApiError.badRequest("Missing required parameter: client_id");
  if (!params.redirect_uri) throw ApiError.badRequest("Missing required parameter: redirect_uri");

  const app = await getApplicationForAuthorize(params.client_id, params.redirect_uri);

  // If user clicked Cancel
  if (params.consent === "deny") {
    const cancelUrl = `${params.redirect_uri}${params.redirect_uri.includes("?") ? "&" : "?"}error=access_denied&error_description=User+denied+access${params.state ? `&state=${encodeURIComponent(params.state)}` : ""}`;
    return res.redirect(cancelUrl);
  }

  let authenticatedUserId: string | null = req.user?.id || null;
  let authenticatedUserObj: { id: string; email: string; name?: string } | null = null;

  // If user already authenticated via bearer or cookie
  if (authenticatedUserId) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, authenticatedUserId));

    if (user) {
      authenticatedUserObj = {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName || ""}`.trim(),
      };
    } else {
      authenticatedUserId = null;
    }
  }

  // If user submitted credentials on the authorization form
  if (!authenticatedUserId && params.email && params.password) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, params.email))
      .limit(1);

    if (user && user.password) {
      const isMatch = await bcrypt.compare(params.password, user.password);
      if (isMatch) {
        if (!user.isEmailverified) {
          const html = renderConsentPage({
            appName: app.appName,
            appLogoUrl: app.appLogoUrl,
            appUrl: app.appUrl,
            userSupportEmail: app.userSupportEmail,
            clientId: params.client_id,
            redirectUri: params.redirect_uri,
            scope: params.scope,
            state: params.state,
            nonce: params.nonce,
            codeChallenge: params.code_challenge,
            codeChallengeMethod: params.code_challenge_method,
            errorMessage: "Your Book_My_Show email is not verified yet. Please verify it before authorizing.",
          });
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.status(403).send(html);
        }

        authenticatedUserId = user.id;
        authenticatedUserObj = {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName || ""}`.trim(),
        };
      } else {
        const html = renderConsentPage({
          appName: app.appName,
          appLogoUrl: app.appLogoUrl,
          appUrl: app.appUrl,
          userSupportEmail: app.userSupportEmail,
          clientId: params.client_id,
          redirectUri: params.redirect_uri,
          scope: params.scope,
          state: params.state,
          nonce: params.nonce,
          codeChallenge: params.code_challenge,
          codeChallengeMethod: params.code_challenge_method,
          errorMessage: "Invalid email or password. Please try again.",
        });
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(401).send(html);
      }
    } else {
      const html = renderConsentPage({
        appName: app.appName,
        appLogoUrl: app.appLogoUrl,
        appUrl: app.appUrl,
        userSupportEmail: app.userSupportEmail,
        clientId: params.client_id,
        redirectUri: params.redirect_uri,
        scope: params.scope,
        state: params.state,
        nonce: params.nonce,
        codeChallenge: params.code_challenge,
        codeChallengeMethod: params.code_challenge_method,
        errorMessage: "User with this email does not exist.",
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(401).send(html);
    }
  }

  // If user is still not authenticated, render login/consent UI for browser requests
  if (!authenticatedUserId) {
    if (req.method === "GET" || req.accepts("html")) {
      const html = renderConsentPage({
        appName: app.appName,
        appLogoUrl: app.appLogoUrl,
        appUrl: app.appUrl,
        userSupportEmail: app.userSupportEmail,
        clientId: params.client_id,
        redirectUri: params.redirect_uri,
        scope: params.scope,
        state: params.state,
        nonce: params.nonce,
        codeChallenge: params.code_challenge,
        codeChallengeMethod: params.code_challenge_method,
        user: authenticatedUserObj,
      });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } else {
      throw ApiError.unAuthorized("Authentication required to authorize application");
    }
  }

  // Complete authorization and generate code
  const { redirectUrl, code } = await authorize(params, authenticatedUserId);

  if (req.headers.accept?.includes("application/json") && req.method === "POST" && !params.consent) {
    return res.status(200).json({
      success: true,
      code,
      redirect_uri: redirectUrl,
      state: params.state,
    });
  }

  return res.redirect(redirectUrl);
};

// Token Endpoint (POST /oauth/token)
const tokenHandler = async (req: Request, res: Response) => {
  const credentials = extractClientCredentials(req);
  const tokenRequest: TokenRequest = {
    grant_type: req.body.grant_type,
    code: req.body.code,
    redirect_uri: req.body.redirect_uri,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code_verifier: req.body.code_verifier,
    refresh_token: req.body.refresh_token,
  };

  const tokenResponse = await exchangeToken(tokenRequest, credentials);

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.status(200).json(tokenResponse);
};

// UserInfo Endpoint (GET and POST /oauth/userinfo)
const userInfoHandler = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw ApiError.unAuthorized("Bearer token required to access userinfo");
  }

  const userInfo = await getUserInfo(req.user.id);
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(userInfo);
};

// Revocation Endpoint (POST /oauth/revoke)
const revokeHandler = async (req: Request, res: Response) => {
  const token = req.body?.token || (req.query?.token as string);
  if (!token) throw ApiError.badRequest("Missing required parameter: 'token'");

  let credentials: { clientId: string; clientSecret: string } | undefined;
  try {
    credentials = extractClientCredentials(req);
  } catch (err) {
    // Optional in revocation per RFC 7009 if token doesn't require client auth
  }

  await revokeToken(token, credentials);
  res.status(200).json({ success: true, message: "Token revoked successfully" });
};

export {
  oidcHandler,
  jwksHandler,
  authorizeHandler,
  tokenHandler,
  userInfoHandler,
  revokeHandler,
};

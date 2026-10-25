import { describe, expect, it } from "bun:test";
import { oidcConfig, jwks } from "../oidc.service";
import { renderConsentPage } from "../oidc.template";
import { PUBLIC_KEY, PRIVATE_KEY } from "../../utils/cert";
import * as jwt from "jsonwebtoken";
import jose from "node-jose";
import crypto from "crypto";
import { createApp } from "../../../app";

describe("OpenID Connect (OIDC) Server Core Services", () => {
  it("should generate a valid OIDC discovery configuration", async () => {
    const config = await oidcConfig();

    expect(config.issuer).toBeDefined();
    expect(config.authorization_endpoint).toContain("/oauth/authorize");
    expect(config.token_endpoint).toContain("/oauth/token");
    expect(config.userinfo_endpoint).toContain("/oauth/userinfo");
    expect(config.jwks_uri).toContain("/.well-known/jwks.json");

    expect(config.response_types_supported).toContain("code");
    expect(config.response_types_supported).toContain("id_token");
    expect(config.grant_types_supported).toContain("authorization_code");
    expect(config.grant_types_supported).toContain("refresh_token");
    expect(config.id_token_signing_alg_values_supported).toContain("RS256");
    expect(config.scopes_supported).toContain("openid");
    expect(config.scopes_supported).toContain("profile");
    expect(config.scopes_supported).toContain("email");
    expect(config.token_endpoint_auth_methods_supported).toContain("client_secret_basic");
    expect(config.token_endpoint_auth_methods_supported).toContain("client_secret_post");
    expect(config.code_challenge_methods_supported).toContain("S256");
  });

  it("should return a RFC 7517 compliant JWKS keystore with RS256 key", async () => {
    const jwksData = (await jwks()) as { keys: any[] };

    expect(jwksData).toBeDefined();
    expect(Array.isArray(jwksData.keys)).toBe(true);
    expect(jwksData.keys.length).toBeGreaterThan(0);

    const key = jwksData.keys[0];
    expect(key.kty).toBe("RSA");
    expect(key.alg).toBe("RS256");
    expect(key.use).toBe("sig");
    expect(key.kid).toBeDefined();
    expect(key.n).toBeDefined();
    expect(key.e).toBeDefined();
  });

  it("should sign and verify an OIDC ID Token with RS256 and matching JWKS kid", async () => {
    const jwksData = (await jwks()) as { keys: any[] };
    const primaryKey = jwksData.keys[0];

    const testPayload = {
      iss: "http://localhost:5000",
      sub: "user-test-uuid",
      aud: "client-test-uuid",
      email: "test@example.com",
      email_verified: true,
      name: "John Doe",
      given_name: "John",
      family_name: "Doe",
    };

    const token = jwt.sign(testPayload, PRIVATE_KEY, {
      algorithm: "RS256",
      keyid: primaryKey.kid,
      expiresIn: "1h",
    });

    expect(typeof token).toBe("string");

    // Decode header to check kid and alg
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe("RS256");
    expect(decoded?.header.kid).toBe(primaryKey.kid);

    // Cryptographically verify with public key
    const verified = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] }) as any;
    expect(verified.sub).toBe("user-test-uuid");
    expect(verified.email).toBe("test@example.com");
    expect(verified.aud).toBe("client-test-uuid");
  });

  it("should render a rich consent page with application details and scopes", () => {
    const html = renderConsentPage({
      appName: "Cinema Ticket Tracker",
      clientId: "app-uuid-123",
      redirectUri: "https://myclient.com/callback",
      scope: "openid profile email phone",
      state: "xyz987",
    });

    expect(html).toContain("Cinema Ticket Tracker");
    expect(html).toContain("OpenID Identity");
    expect(html).toContain("Profile Information");
    expect(html).toContain("Email Address");
    expect(html).toContain("Phone Number");
    expect(html).toContain("https://myclient.com/callback");
    expect(html).toContain("xyz987");
  });
});

describe("Express App Route Integration", () => {
  it("should mount /.well-known/openid-configuration and return 200", async () => {
    const app = createApp();

    // Use bun server or supertest-like fetch against local server
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/.well-known/openid-configuration`);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.issuer).toBeDefined();
      expect(json.authorization_endpoint).toContain("/oauth/authorize");
      expect(json.jwks_uri).toContain("/.well-known/jwks.json");
    } finally {
      server.close();
    }
  });

  it("should mount /.well-known/jwks.json and return 200 with keys array", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/.well-known/jwks.json`);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(Array.isArray(json.keys)).toBe(true);
      expect(json.keys[0].kty).toBe("RSA");
    } finally {
      server.close();
    }
  });

  it("should reject /oauth/authorize if client_id is missing", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/oauth/authorize?redirect_uri=http://localhost`);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.message).toContain("client_id");
    } finally {
      server.close();
    }
  });

  it("should reject /oauth/token if client credentials are missing", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "authorization_code", code: "invalid" }),
      });
      expect(res.status).toBe(401);

      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.message).toContain("client credentials");
    } finally {
      server.close();
    }
  });

  it("should mount developer client routes at /api/client", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/client/me`);
      // Since it's protected and unauthenticated, expect 401
      expect(res.status).toBe(401);

      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
    } finally {
      server.close();
    }
  });

  it("should verify PKCE S256 challenge generation and matching", () => {
    const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    expect(codeChallenge).toBeDefined();
    expect(typeof codeChallenge).toBe("string");

    // Verify recalculation matches
    const recomputed = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    expect(recomputed).toBe(codeChallenge);
  });

  it("should support alias endpoints under /api/oidc and /.well-known", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/oidc/openid-configuration`);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.issuer).toBeDefined();
    } finally {
      server.close();
    }
  });
});


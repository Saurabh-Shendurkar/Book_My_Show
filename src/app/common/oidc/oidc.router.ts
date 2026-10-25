import { Router } from "express";
import {
  jwksHandler,
  oidcHandler,
  authorizeHandler,
  tokenHandler,
  userInfoHandler,
  revokeHandler,
} from "./oidc.controller";

const router = Router();

// OIDC Discovery & JWKS
router.get("/openid-configuration", oidcHandler);
router.get("/.well-known/openid-configuration", oidcHandler);
router.get("/jwks.json", jwksHandler);
router.get("/.well-known/jwks.json", jwksHandler);

// OAuth2 / OIDC Core Endpoints
router.get("/authorize", authorizeHandler);
router.post("/authorize", authorizeHandler);

router.post("/token", tokenHandler);

router.get("/userinfo", userInfoHandler);
router.post("/userinfo", userInfoHandler);

router.post("/revoke", revokeHandler);

export default router;
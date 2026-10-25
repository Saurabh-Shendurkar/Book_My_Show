import { Router } from "express";
import {
  registerClientHandler,
  verifyClientHandler,
  loginClientHandler,
  requestVerificationHandler,
  getClientInfoHandler,
  generateClientSecretHandler,
  revokeClientSecretHandler,
  verifyClientSecretHandler,
  registerApplicationHandler,
  getClientApplicationsHandler,
  getClientApplicationByIdHandler,
  deleteClientApplicationHandler,
  getClientSubscriptionsHandler,
} from "./client.controller";
import { parseRequest } from "../../common/middleware/parse.middlware";
import { registerClientDto } from "./dto/registerClient.dto";
import { loginClientDto } from "./dto/loginClient.dto";
import { generateSecretDto } from "./dto/generateSecret.dto";
import { revokeClientSecretDto } from "./dto/revokeClientSecret.dto";
import { verifyClientSecretDto } from "./dto/verifyClientSecret.dto";
import { registerClientAppDto } from "./dto/registerClientApp.dto";
import { restrictUnAuthenticatedClient } from "./client.middleware";

const router = Router();

// Public routes
router.post("/sign-up", parseRequest(registerClientDto), registerClientHandler);
router.get("/verify", verifyClientHandler);
router.post("/sign-in", parseRequest(loginClientDto), loginClientHandler);

// Authenticated client routes
router.post("/request-verification", restrictUnAuthenticatedClient(), requestVerificationHandler);
router.get("/me", restrictUnAuthenticatedClient(), getClientInfoHandler);

// Secret management
router.post("/secret/generate", restrictUnAuthenticatedClient(), parseRequest(generateSecretDto), generateClientSecretHandler);
router.post("/secret/revoke", restrictUnAuthenticatedClient(), parseRequest(revokeClientSecretDto), revokeClientSecretHandler);
router.post("/secret/verify", restrictUnAuthenticatedClient(), parseRequest(verifyClientSecretDto), verifyClientSecretHandler);

// Application (OAuth / OIDC Client) management
router.post("/app", restrictUnAuthenticatedClient(), parseRequest(registerClientAppDto), registerApplicationHandler);
router.get("/app", restrictUnAuthenticatedClient(), getClientApplicationsHandler);
router.get("/app/:id", restrictUnAuthenticatedClient(), getClientApplicationByIdHandler);
router.delete("/app/:id", restrictUnAuthenticatedClient(), deleteClientApplicationHandler);

// Subscriptions
router.get("/subscriptions", restrictUnAuthenticatedClient(), getClientSubscriptionsHandler);

export default router;

import type { Request, Response } from "express";
import {
  registerClient,
  verifyClient,
  LoginClient,
  requestVerification,
  getClientInfo,
  generateClientSecret,
  revokeClientSecret,
  verifyClientSecret,
  registerApplication,
  getClientApplications,
  getClientApplicationById,
  deleteClientApplication,
  getClientSubscriptions,
} from "./client.service";
import { ApiResponse } from "../../common/utils/api.response";
import { ApiError } from "../../common/utils/api.error";

const registerClientHandler = async (req: Request, res: Response) => {
  await registerClient(req.body);
  ApiResponse.created(res, "Client registered successfully. Please verify your email.");
};

const verifyClientHandler = async (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.body.token;
  if (!token) throw ApiError.badRequest("Verification token is required");
  await verifyClient(token);
  ApiResponse.ok(res, "Client verified successfully");
};

const loginClientHandler = async (req: Request, res: Response) => {
  const { access_token, refresh_token } = await LoginClient(req.body);

  res.cookie("clientRefreshToken", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/client/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  ApiResponse.ok(res, "Client logged in successfully", { access_token, refresh_token });
};

const requestVerificationHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  await requestVerification(req.user);
  ApiResponse.ok(res, "Verification email sent successfully");
};

const getClientInfoHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const info = await getClientInfo(req.user);
  ApiResponse.ok(res, "Client info fetched successfully", info);
};

const generateClientSecretHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const clientSecret = await generateClientSecret(req.user, req.body);
  ApiResponse.ok(res, "Client secret generated successfully. Save this secret securely, it will not be shown again.", {
    clientSecret,
  });
};

const revokeClientSecretHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  await revokeClientSecret(req.user, req.body);
  ApiResponse.ok(res, "Client secret revoked successfully");
};

const verifyClientSecretHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  await verifyClientSecret(req.user, req.body);
  ApiResponse.ok(res, "Client secret is valid");
};

const registerApplicationHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const app = await registerApplication(req.body, req.user);
  ApiResponse.created(res, "Application registered successfully", app);
};

const getClientApplicationsHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const apps = await getClientApplications(req.user);
  ApiResponse.ok(res, "Applications fetched successfully", apps);
};

const getClientApplicationByIdHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const appId = req.params.id as string;
  const app = await getClientApplicationById(req.user, appId);
  ApiResponse.ok(res, "Application fetched successfully", app);
};

const deleteClientApplicationHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const appId = req.params.id as string;
  await deleteClientApplication(req.user, appId);
  ApiResponse.ok(res, "Application deleted successfully");
};

const getClientSubscriptionsHandler = async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unAuthorized("Client not authenticated");
  const subscriptions = await getClientSubscriptions(req.user);
  ApiResponse.ok(res, "Subscriptions fetched successfully", subscriptions);
};

export {
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
};

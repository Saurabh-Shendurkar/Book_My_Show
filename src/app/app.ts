import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./common/middleware/error.middleware";
import { authenticateMidleware } from "./module/auth/auth.middleware";
import authRouter from "./module/auth/auth.route";
import bookingRouter from "./module/booking/booking.route";
import OIDCRouter from "./common/oidc/oidc.router";
import clientRouter from "./module/oidc_client/client.router";

export function createApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(authenticateMidleware());

  // OIDC & OAuth2 Server Routes
  app.use("/.well-known", OIDCRouter);
  app.use("/oauth", OIDCRouter);
  app.use("/api/oidc", OIDCRouter);

  // Developer Client Management Routes
  app.use("/api/client", clientRouter);

  // Core API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/booking", bookingRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
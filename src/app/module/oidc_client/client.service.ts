import "dotenv/config";
import { db } from "../../common/config/db";
import { applicationsTable, clientsTable, applicationSubscriptionsTable } from "./client.schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import type { registerClientRequest } from "./dto/registerClient.dto";
import { ApiError } from "../../common/utils/api.error";
import { sendEmail } from "../../common/utils/send.email";
import { createAccessToken, createRefreshToken, generateToken, type userPayload } from "../../common/utils/jwt.utils";
import VerifyUserEmail from "../auth/emailTemplate/verifyUser";
import React from "react";
import crypto from "crypto";
import type { loginClientRequest } from "./dto/loginClient.dto";
import type { registerClientAppRequest } from "./dto/registerClientApp.dto";
import type { generateClientSecretRequest } from "./dto/generateSecret.dto";
import type { revokeClientSecretRequest } from "./dto/revokeClientSecret.dto";
import type { verifyClientSecretRequest } from "./dto/verifyClientSecret.dto";

const registerClient = async (clientRequest: registerClientRequest) => {
  if (!clientRequest) throw ApiError.badRequest("Invalid request");
  const [existingClient] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clientEmail, clientRequest.clientEmail));
  if (existingClient) throw ApiError.badRequest("Client already exists");

  const hashedPassword = bcrypt.hashSync(clientRequest.clientPassword, 12);
  const { rawToken, hashedToken, expiresAt } = generateToken();

  const [newClient] = await db
    .insert(clientsTable)
    .values({
      clientEmail: clientRequest.clientEmail,
      clientFirstName: clientRequest.clientFirstName,
      clientLastName: clientRequest.clientLastName,
      clientMobileNo: clientRequest.clientMobileNo,
      clientPassword: hashedPassword,
      verificationToken: hashedToken,
      verificationTokenExpiresAt: expiresAt,
    })
    .returning();

  if (!newClient) throw ApiError.serverFailure("Failed to register new client.");

  const sendMailRes = await sendEmail({
    to: clientRequest.clientEmail,
    subject: "Welcome! Please verify your Email",
    template: React.createElement(VerifyUserEmail, {
      firstName: clientRequest.clientFirstName,
      verificationLink: `${process.env.DOMAIN || "http://localhost:5000"}/api/client/verify?token=${rawToken}`,
    }),
  });
  if (!sendMailRes.success) throw ApiError.serverFailure(`Failed to send mail to ${clientRequest.clientEmail}`);
  return true;
};

const verifyClient = async (token: string) => {
  if (!token) throw ApiError.badRequest("Missing Token");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.verificationToken, hashedToken));

  if (!client || (client.verificationTokenExpiresAt && client.verificationTokenExpiresAt < new Date()))
    throw ApiError.badRequest("Invalid or Expired Token");

  const [verifiedClient] = await db
    .update(clientsTable)
    .set({
      isClientVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(clientsTable.clientEmail, client.clientEmail))
    .returning();

  if (!verifiedClient) throw ApiError.serverFailure("Failed to verify the client");
  return true;
};

const LoginClient = async (clientRequest: loginClientRequest) => {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clientEmail, clientRequest.clientEmail))
    .limit(1);

  if (!client || !client.clientPassword) throw ApiError.badRequest("Invalid email or password");

  const isPasswordMatch = await bcrypt.compare(clientRequest.clientPassword, client.clientPassword);
  if (!isPasswordMatch) throw ApiError.badRequest("Invalid email or password");

  if (!client.isClientVerified) throw ApiError.unAuthorized("Client email is not verified");

  const access_token = createAccessToken({ id: client.clientId });
  const refresh_token = createRefreshToken({ id: client.clientId });

  await db
    .update(clientsTable)
    .set({ refreshToken: refresh_token })
    .where(eq(clientsTable.clientEmail, client.clientEmail));

  return { access_token, refresh_token };
};

const requestVerification = async (clientPayload: userPayload) => {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(
      and(
        eq(clientsTable.clientId, clientPayload.id),
        eq(clientsTable.isClientVerified, false)
      )
    );
  if (!client) throw ApiError.badRequest("Client not found or already verified");

  const { rawToken, hashedToken, expiresAt } = generateToken();

  const [updatedClient] = await db
    .update(clientsTable)
    .set({
      verificationToken: hashedToken,
      verificationTokenExpiresAt: expiresAt,
    })
    .where(eq(clientsTable.clientId, clientPayload.id))
    .returning();

  if (!updatedClient) throw ApiError.serverFailure("Failed to generate verification token");

  const sendMailRes = await sendEmail({
    to: client.clientEmail,
    subject: "Please verify your account via this email",
    template: React.createElement(VerifyUserEmail, {
      firstName: client.clientFirstName,
      verificationLink: `${process.env.DOMAIN || "http://localhost:5000"}/api/client/verify?token=${rawToken}`,
    }),
  });
  if (!sendMailRes.success) throw ApiError.serverFailure("Failed to send verification email");
  return true;
};

const getClientInfo = async (clientPayload: userPayload) => {
  const [client] = await db
    .select({
      id: clientsTable.clientId,
      firstName: clientsTable.clientFirstName,
      lastName: clientsTable.clientLastName,
      email: clientsTable.clientEmail,
      mobileNo: clientsTable.clientMobileNo,
      isCurrentClientSecretRevealed: clientsTable.isCurrentClientSecretRevealed,
      isClientVerified: clientsTable.isClientVerified,
      createdAt: clientsTable.createdAt,
    })
    .from(clientsTable)
    .where(eq(clientsTable.clientId, clientPayload.id));

  if (!client) throw ApiError.notFound("Client not found");
  return client;
};

const generateClientSecret = async (
  clientPayload: userPayload,
  clientRequest: generateClientSecretRequest
) => {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clientId, clientPayload.id));

  if (!client || !client.clientPassword) throw ApiError.notFound("Client not found");

  const isPasswordMatch = await bcrypt.compare(clientRequest.clientPassword, client.clientPassword);
  if (!isPasswordMatch) throw ApiError.badRequest("Invalid password");

  if (client.isCurrentClientSecretRevealed) {
    throw ApiError.badRequest("Secret has already been revealed once. Revoke it first to regenerate.");
  }

  const clientSecret = crypto.randomBytes(32).toString("hex");
  const hashedSecret = crypto.createHash("sha256").update(clientSecret).digest();

  const [updatedClient] = await db
    .update(clientsTable)
    .set({
      clientSecret: hashedSecret,
      isCurrentClientSecretRevealed: true,
    })
    .where(eq(clientsTable.clientId, clientPayload.id))
    .returning();

  if (!updatedClient) throw ApiError.serverFailure("Failed to generate client secret");
  return clientSecret;
};

const revokeClientSecret = async (
  clientPayload: userPayload,
  clientRequest: revokeClientSecretRequest
) => {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clientId, clientPayload.id));

  if (!client || !client.clientPassword) throw ApiError.notFound("Client not found");

  const isPasswordMatch = await bcrypt.compare(clientRequest.clientPassword, client.clientPassword);
  if (!isPasswordMatch) throw ApiError.badRequest("Invalid password");

  const [updatedClient] = await db
    .update(clientsTable)
    .set({
      clientSecret: null,
      isCurrentClientSecretRevealed: false,
    })
    .where(eq(clientsTable.clientId, clientPayload.id))
    .returning();

  if (!updatedClient) throw ApiError.serverFailure("Failed to revoke client secret");
  return true;
};

const verifyClientSecret = async (
  clientPayload: userPayload,
  clientRequest: verifyClientSecretRequest
) => {
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.clientId, clientPayload.id));

  if (!client || !client.clientSecret) throw ApiError.badRequest("Invalid client or secret not set");

  const hashedSecret = crypto.createHash("sha256").update(clientRequest.clientSecret).digest();
  const storedSecretBuffer = Buffer.isBuffer(client.clientSecret)
    ? client.clientSecret
    : Buffer.from(client.clientSecret);

  if (hashedSecret.length !== storedSecretBuffer.length) {
    throw ApiError.badRequest("Invalid client secret");
  }

  const isValid = crypto.timingSafeEqual(hashedSecret, storedSecretBuffer);
  if (!isValid) throw ApiError.badRequest("Invalid client secret");
  return true;
};

const registerApplication = async (
  clientRequest: registerClientAppRequest,
  clientPayload: userPayload
) => {
  const clientId = clientPayload.id;
  const [client] = await db
    .select()
    .from(clientsTable)
    .where(
      and(
        eq(clientsTable.clientId, clientId),
        eq(clientsTable.isClientVerified, true)
      )
    );

  if (!client) throw ApiError.forbidden("Invalid or unverified client");

  const [newApp] = await db
    .insert(applicationsTable)
    .values({
      clientId,
      appName: clientRequest.appName,
      appPivacyPolicyUrl: clientRequest.appPrivacyPolicyUrl,
      appUrl: clientRequest.appUrl,
      appLogoUrl: clientRequest.appLogoUrl,
      clientEmail: client.clientEmail,
      userSupportEmail: clientRequest.userSupportEmail,
      redirectUrl: clientRequest.redirectUrl,
    })
    .returning();

  if (!newApp) throw ApiError.serverFailure("Failed to register application");
  return newApp;
};

const getClientApplications = async (clientPayload: userPayload) => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.clientId, clientPayload.id));
  return apps;
};

const getClientApplicationById = async (clientPayload: userPayload, appId: string) => {
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(
      and(
        eq(applicationsTable.clientAppId, appId),
        eq(applicationsTable.clientId, clientPayload.id)
      )
    );
  if (!app) throw ApiError.notFound("Application not found");
  return app;
};

const deleteClientApplication = async (clientPayload: userPayload, appId: string) => {
  const [deletedApp] = await db
    .delete(applicationsTable)
    .where(
      and(
        eq(applicationsTable.clientAppId, appId),
        eq(applicationsTable.clientId, clientPayload.id)
      )
    )
    .returning();
  if (!deletedApp) throw ApiError.notFound("Application not found");
  return true;
};

const getClientSubscriptions = async (clientPayload: userPayload) => {
  const apps = await db
    .select({ appId: applicationsTable.clientAppId })
    .from(applicationsTable)
    .where(eq(applicationsTable.clientId, clientPayload.id));

  const appIds = apps.map((a) => a.appId);
  if (appIds.length === 0) return [];

  const subscriptions = await db
    .select()
    .from(applicationSubscriptionsTable);

  return subscriptions.filter((s) => appIds.includes(s.applicationId));
};

export {
  registerClient,
  verifyClient,
  LoginClient,
  registerApplication,
  requestVerification,
  getClientInfo,
  generateClientSecret,
  revokeClientSecret,
  verifyClientSecret,
  getClientApplications,
  getClientApplicationById,
  deleteClientApplication,
  getClientSubscriptions,
};
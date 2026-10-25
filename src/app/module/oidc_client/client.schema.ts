import { pgTable, varchar, boolean, uuid, text, timestamp, bytea, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "../auth/auth.schema";

export const clientsTable = pgTable("client", {
  clientId: uuid("client_id").primaryKey().defaultRandom(),
  clientEmail: varchar("client_email", { length: 322 }).notNull().unique(),
  clientFirstName: varchar("client_first_name", { length: 50 }).notNull(),
  clientLastName: varchar("client_last_name", { length: 50 }),
  clientMobileNo: varchar("client_mobile_no", { length: 15 }),
  clientPassword: varchar("client_password", { length: 65 }),
  clientSecret: bytea("client_secret"),
  isCurrentClientSecretRevealed: boolean("is_current_client_secret").default(false),
  isClientVerified: boolean("is_client_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
  refreshToken: text("refresh_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordTokenExpiresAt: timestamp("reset_password_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const applicationsTable = pgTable("applications", {
  clientAppId: uuid("client_app_id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.clientId, { onDelete: "cascade" }),
  appName: varchar("app_name", { length: 100 }).notNull(),
  userSupportEmail: varchar("user_support_email", { length: 322 }).notNull(),
  clientEmail: varchar("user_email", { length: 322 })
    .notNull()
    .references(() => clientsTable.clientEmail, { onUpdate: "cascade" }),
  appUrl: text("app_url").notNull(),
  appLogoUrl: text("app_logo_link"),
  appPivacyPolicyUrl: text("app_privacy_policy_link").notNull(),
  redirectUrl: text("redirect_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const applicationSubscriptionsTable = pgTable(
  "application_subscription",
  {
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applicationsTable.clientAppId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    verificationCode: text("verification_code"),
    verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
    redirectUri: text("redirect_uri"),
    scope: text("scope"),
    nonce: text("nonce"),
    codeChallenge: text("code_challenge"),
    codeChallengeMethod: text("code_challenge_method"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.applicationId, table.userId] }),
  })
);
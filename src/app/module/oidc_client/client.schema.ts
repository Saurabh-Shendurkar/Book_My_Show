import {pgTable, varchar, boolean,uuid, text,timestamp} from "drizzle-orm/pg-core"

export const applicationsTable= pgTable("applications",{
    clientId:uuid("client_id").primaryKey().defaultRandom(),
    appName:varchar("app_name",{length:100}).notNull(),
    userSupportEmail:varchar("user_support_email",{length:322}).notNull(),
    clientEmail:varchar("user_email",{length:322}).notNull(),
    appUrl:varchar("app_url",{length:300}).notNull(),
    appLogoLink:varchar("app_logo_link",{length:300}),
    appPivacyPolicyLink:varchar("app_privacy_policy_link",{length:300}).notNull(),
    redirectUrl:varchar("redirect_url",{length:322}).notNull(),
    clientSecret:varchar("client_secret",{length:322}).notNull(),
})

export const clientsTable= pgTable("client",{
    clientEmail:varchar("client_email",{length:322}).primaryKey(),
    clientFirstName:varchar("client_first_name",{length:50}).notNull(),
    clientLastName:varchar("client_last_name",{length:50}),
    clientMobileNo:varchar("client_mobile_no",{length:15}),
    clientPassword:varchar("client_password",{length:65}),
    isClientVerified:boolean("is_client_verified").default(false),
    verificationToken:text("verification_token"),
    verificationTokenExpiresAt:timestamp("verification_token_expires_at"),
    refreshToken:text("refresh_token"),
    resetPasswordToken:text("reset_password_token"),
    resetPasswordTokenExpiresAt:timestamp("reset_password_token_expires_at"),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").$onUpdateFn(()=>new Date())
})
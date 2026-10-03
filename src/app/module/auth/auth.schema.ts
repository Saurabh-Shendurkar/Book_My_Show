import { boolean, pgTable, text, timestamp, uuid, varchar,  } from "drizzle-orm/pg-core";

export const usersTable= pgTable("users",{
    id:uuid("id").primaryKey().defaultRandom(),
    firstName:varchar("first_name",{length:50}).notNull(),
    lastName:varchar("last_name",{length:50}),
    email:varchar("email",{length:322}).unique().notNull(),
    phoneNo:varchar("phone_no",{length:15}).unique(),
    isEmailverified:boolean("is_email_verified").default(false),
    password:varchar("password",{length:65}),
    verificationToken:text("verification_token"),
    verificationTokenExpiresAt:timestamp("verification_token_expires_at"),
    refreshToken:text("refresh_token"),
    resetPasswordToken:text("reset_password_token"),
    resetPasswordTokenExpiresAt:timestamp("reset_password_token_expires_at"),
    createdAt:timestamp("created_at").defaultNow().notNull(),
    updatedAt:timestamp("updated_at").$onUpdateFn(()=>new Date())
})
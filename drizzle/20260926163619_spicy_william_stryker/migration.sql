ALTER TABLE "users" RENAME COLUMN "salt" TO "verification_token";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token" text;
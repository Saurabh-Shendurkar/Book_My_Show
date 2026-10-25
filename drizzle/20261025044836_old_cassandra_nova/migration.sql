CREATE TABLE "application_subscription" (
	"application_id" uuid,
	"user_id" uuid,
	"verification_code" text,
	"verification_code_expires_at" timestamp,
	"redirect_uri" text,
	"scope" text,
	"nonce" text,
	"code_challenge" text,
	"code_challenge_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "application_subscription_pkey" PRIMARY KEY("application_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"client_app_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"app_name" varchar(100) NOT NULL,
	"user_support_email" varchar(322) NOT NULL,
	"user_email" varchar(322) NOT NULL,
	"app_url" text NOT NULL,
	"app_logo_link" text,
	"app_privacy_policy_link" text NOT NULL,
	"redirect_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "client" (
	"client_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_email" varchar(322) NOT NULL UNIQUE,
	"client_first_name" varchar(50) NOT NULL,
	"client_last_name" varchar(50),
	"client_mobile_no" varchar(15),
	"client_password" varchar(65),
	"client_secret" bytea,
	"is_current_client_secret" boolean DEFAULT false,
	"is_client_verified" boolean DEFAULT false,
	"verification_token" text,
	"verification_token_expires_at" timestamp,
	"refresh_token" text,
	"reset_password_token" text,
	"reset_password_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "application_subscription" ADD CONSTRAINT "application_subscription_AprcFuAKhfDv_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("client_app_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "application_subscription" ADD CONSTRAINT "application_subscription_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_client_id_client_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("client_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_email_client_client_email_fkey" FOREIGN KEY ("user_email") REFERENCES "client"("client_email") ON UPDATE CASCADE;
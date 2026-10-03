CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50),
	"email" varchar(322) NOT NULL UNIQUE,
	"phone_no" varchar(15) UNIQUE,
	"is_email_verified" boolean DEFAULT false,
	"password" varchar(65),
	"verification_token" text,
	"verification_token_expires_at" timestamp,
	"refresh_token" text,
	"reset_password_token" text,
	"reset_password_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);

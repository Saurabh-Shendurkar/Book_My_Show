ALTER TABLE "transaction_table" ADD COLUMN "ammount" numeric(6,2);--> statement-breakpoint
ALTER TABLE "transaction_table" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "transaction_status_enum";--> statement-breakpoint
CREATE TYPE "transaction_status_enum" AS ENUM('Successful', 'Failure');--> statement-breakpoint
ALTER TABLE "transaction_table" ALTER COLUMN "status" SET DATA TYPE "transaction_status_enum" USING "status"::"transaction_status_enum";--> statement-breakpoint
ALTER TABLE "bookings_table" ALTER COLUMN "final_price" SET DATA TYPE numeric(6,2) USING "final_price"::numeric(6,2);
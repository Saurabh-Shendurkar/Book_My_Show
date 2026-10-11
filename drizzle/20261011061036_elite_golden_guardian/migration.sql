CREATE TYPE "action" AS ENUM('Booking', 'Cancellation');--> statement-breakpoint
CREATE TYPE "transaction_status_enum" AS ENUM('Successfull', 'Failure');--> statement-breakpoint
CREATE TABLE "transaction_table" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"booking_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "action" NOT NULL,
	"status" "transaction_status_enum" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings_table" ALTER COLUMN "booking_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bookings_table" ALTER COLUMN "booking_status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "booking_status";--> statement-breakpoint
CREATE TYPE "booking_status" AS ENUM('Confirmed', 'Pending', 'Not Booked');--> statement-breakpoint
ALTER TABLE "bookings_table" ALTER COLUMN "booking_status" SET DATA TYPE "booking_status" USING "booking_status"::"booking_status";--> statement-breakpoint
ALTER TABLE "bookings_table" ALTER COLUMN "booking_status" SET DEFAULT 'Not Booked'::"booking_status";--> statement-breakpoint
ALTER TABLE "bookings_table" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_table" ADD CONSTRAINT "transaction_table_booking_id_bookings_table_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings_table"("booking_id");--> statement-breakpoint
ALTER TABLE "transaction_table" ADD CONSTRAINT "transaction_table_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");
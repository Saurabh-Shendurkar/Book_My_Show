CREATE TYPE "booking_status" AS ENUM('Confirmed', 'Pending', 'Not Booked', 'Canceled');--> statement-breakpoint
CREATE TYPE "seat_category" AS ENUM('vip', 'premium', 'regular');--> statement-breakpoint
CREATE TYPE "show_time" AS ENUM('9am-12pm', '12pm-3pm', '3pm-6pm', '6pm-9pm', '9pm-12am');--> statement-breakpoint
CREATE TABLE "bookings_table" (
	"booking_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"show_id" uuid NOT NULL,
	"seat_id" uuid NOT NULL,
	"final_price" numeric(5,1),
	"user_id" uuid NOT NULL,
	"booking_status" "booking_status" DEFAULT 'Not Booked'::"booking_status",
	CONSTRAINT "unique_show_seat_booking" UNIQUE("show_id","seat_id")
);
--> statement-breakpoint
CREATE TABLE "movies_table" (
	"movie_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"movie_name" varchar(500) NOT NULL UNIQUE,
	"movie_duration" varchar(50) NOT NULL,
	"price_multiplier" numeric DEFAULT '1' NOT NULL,
	"is_currently_streaming" boolean DEFAULT false,
	"cast" varchar(2000),
	"directed_by" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "seats_table" (
	"seat_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"seat_number" integer UNIQUE,
	"seat_type" "seat_category" NOT NULL,
	"seat_price" integer GENERATED ALWAYS AS (CASE
            WHEN "seats_table"."seat_type"='vip' THEN 1000
            WHEN "seats_table"."seat_type"='premium' THEN 600
            ELSE 300
            END) STORED,
	CONSTRAINT "seat_number" CHECK ("seat_number"<=30)
);
--> statement-breakpoint
CREATE TABLE "shows_table" (
	"show_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"show_date" date,
	"show_time" "show_time" NOT NULL,
	"movie_id" uuid NOT NULL,
	"price_multiplier" numeric DEFAULT '1' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings_table" ADD CONSTRAINT "bookings_table_show_id_shows_table_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows_table"("show_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bookings_table" ADD CONSTRAINT "bookings_table_seat_id_seats_table_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats_table"("seat_id");--> statement-breakpoint
ALTER TABLE "bookings_table" ADD CONSTRAINT "bookings_table_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shows_table" ADD CONSTRAINT "shows_table_movie_id_movies_table_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies_table"("movie_id") ON DELETE CASCADE;
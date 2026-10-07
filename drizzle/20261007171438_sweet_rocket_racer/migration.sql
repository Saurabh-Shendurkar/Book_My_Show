ALTER TABLE "movies_table" RENAME COLUMN "is_currently_streaming" TO "is_currently_screening";--> statement-breakpoint
ALTER TABLE "movies_table" ALTER COLUMN "is_currently_screening" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movies_table" ALTER COLUMN "cast" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movies_table" ALTER COLUMN "directed_by" SET NOT NULL;
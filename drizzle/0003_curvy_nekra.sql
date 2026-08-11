ALTER TABLE "leads" ADD COLUMN "paid_amount" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "paid_currency" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "paid_at" timestamp with time zone;
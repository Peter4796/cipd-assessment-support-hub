CREATE TABLE "subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"level" text,
	"country" text,
	"resource" text NOT NULL,
	"source_page" text NOT NULL,
	"landing_page" text,
	"source_page_type" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text
);
--> statement-breakpoint
CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "subscribers_resource_idx" ON "subscribers" USING btree ("resource");
CREATE TABLE "lead_attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" text NOT NULL,
	"attachment_id" text NOT NULL,
	"pathname" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"category" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"deletion_reason" text,
	"delete_attempts" smallint DEFAULT 0 NOT NULL,
	"last_delete_attempt_at" timestamp with time zone,
	"last_delete_error" text,
	CONSTRAINT "lead_attachments_pathname_unique" UNIQUE("pathname")
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_status_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_status_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"schema_version" smallint NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text,
	"country" text,
	"level" text NOT NULL,
	"unit_code" text,
	"support_type" text NOT NULL,
	"submission_type" text,
	"provider" text,
	"word_count" integer,
	"deadline" date,
	"message" text,
	"referred_criteria" text,
	"score" smallint NOT NULL,
	"classification" text NOT NULL,
	"source_page" text NOT NULL,
	"source_page_type" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"entry_cta" text,
	"funnel_started_at" timestamp with time zone,
	"funnel_completed_at" timestamp with time zone,
	"funnel_duration_seconds" integer,
	"reached_review" boolean DEFAULT false NOT NULL,
	"whatsapp_continued" boolean,
	"status" text DEFAULT 'NEW' NOT NULL,
	"contacted_at" timestamp with time zone,
	"quote_sent_at" timestamp with time zone,
	"payment_confirmed_at" timestamp with time zone,
	"work_started_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"lost_at" timestamp with time zone,
	"lost_reason" text,
	"archived_at" timestamp with time zone,
	"quote_recommended_mid" integer,
	"quoted_amount" integer,
	"quote_currency" text,
	"quote_notes" text,
	"quoted_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"notify_error" text,
	"notify_attempts" smallint DEFAULT 0 NOT NULL,
	"fingerprint" text
);
--> statement-breakpoint
ALTER TABLE "lead_attachments" ADD CONSTRAINT "lead_attachments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_events" ADD CONSTRAINT "lead_status_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_attachments_lead_id_idx" ON "lead_attachments" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_status_events_lead_id_idx" ON "lead_status_events" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_classification_idx" ON "leads" USING btree ("classification");--> statement-breakpoint
CREATE INDEX "leads_deadline_idx" ON "leads" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_fingerprint_idx" ON "leads" USING btree ("fingerprint");
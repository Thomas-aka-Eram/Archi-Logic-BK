ALTER TABLE "repositories" ADD COLUMN "webhook_events" text[];--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "last_synced" timestamp;
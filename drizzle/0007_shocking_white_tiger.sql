ALTER TABLE "users" ADD COLUMN "timezone" varchar(50) DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme" varchar(20) DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_notifications" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "task_assignments" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "review_requests" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weekly_digest" boolean DEFAULT true;
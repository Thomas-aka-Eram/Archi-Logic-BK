ALTER TABLE "blocks" ADD COLUMN "order_index" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "phase" varchar(50);--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
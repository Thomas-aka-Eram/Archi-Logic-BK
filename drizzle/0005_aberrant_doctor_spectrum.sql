ALTER TABLE "tasks" ADD COLUMN "domain_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "phase_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;
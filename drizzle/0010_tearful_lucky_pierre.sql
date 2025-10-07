ALTER TABLE "tasks" ADD COLUMN "numeric_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_numeric_id_unique" UNIQUE("numeric_id");
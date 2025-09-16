CREATE TABLE "block_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	CONSTRAINT "unique_block_domain" UNIQUE("block_id","domain_id")
);
--> statement-breakpoint
CREATE TABLE "block_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_block_tag" UNIQUE("block_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"key" varchar(50) NOT NULL,
	"title" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_domain_per_project" UNIQUE("project_id","key")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"rating" integer,
	"comments" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"key" varchar(50) NOT NULL,
	"title" varchar(150) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_project_phase" UNIQUE("project_id","key")
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"requester_id" uuid,
	"reviewer_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now(),
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tag_closure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ancestor_id" uuid NOT NULL,
	"descendant_id" uuid NOT NULL,
	"depth" integer NOT NULL,
	CONSTRAINT "unique_tag_closure" UNIQUE("ancestor_id","descendant_id")
);
--> statement-breakpoint
CREATE TABLE "task_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_task_tag" UNIQUE("task_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "action" SET DATA TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "entity" SET DATA TYPE varchar(60);--> statement-breakpoint
ALTER TABLE "commits" ALTER COLUMN "commit_hash" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "commits" ALTER COLUMN "author_name" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "commits" ALTER COLUMN "author_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commits" ALTER COLUMN "url" SET DATA TYPE varchar(600);--> statement-breakpoint
ALTER TABLE "commits" ALTER COLUMN "branch" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "title" SET DATA TYPE varchar(250);--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "name" SET DATA TYPE varchar(300);--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "webhook_secret" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "name" SET DATA TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "slug" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "title" SET DATA TYPE varchar(300);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'OPEN';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "block_group_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "rendered_html" text;--> statement-breakpoint
ALTER TABLE "blocks" ADD COLUMN "blocks_search_vector" "tsvector";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "phase_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "domain_id" uuid;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "task_commits" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "estimate_hours" integer;--> statement-breakpoint
ALTER TABLE "block_domains" ADD CONSTRAINT "block_domains_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_domains" ADD CONSTRAINT "block_domains_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_tags" ADD CONSTRAINT "block_tags_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_tags" ADD CONSTRAINT "block_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_closure" ADD CONSTRAINT "tag_closure_ancestor_id_tags_id_fk" FOREIGN KEY ("ancestor_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_closure" ADD CONSTRAINT "tag_closure_descendant_id_tags_id_fk" FOREIGN KEY ("descendant_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_domains_block_idx" ON "block_domains" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "block_tags_tag_idx" ON "block_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "domains_project_idx" ON "domains" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "feedback_project_idx" ON "feedback" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_phases_project_idx" ON "project_phases" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "review_requests_block_idx" ON "review_requests" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "tag_closure_ancestor_idx" ON "tag_closure" USING btree ("ancestor_id");--> statement-breakpoint
CREATE INDEX "tag_closure_descendant_idx" ON "tag_closure" USING btree ("descendant_id");--> statement-breakpoint
CREATE INDEX "task_tags_tag_idx" ON "task_tags" USING btree ("tag_id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "blocks_block_group_idx" ON "blocks" USING btree ("block_group_id","is_current_version");--> statement-breakpoint
CREATE INDEX "blocks_search_idx" ON "blocks" USING gin ("blocks_search_vector");--> statement-breakpoint
CREATE INDEX "repositories_project_idx" ON "repositories" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tags_project_idx" ON "tags" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "task_commits_task_idx" ON "task_commits" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_dependencies_task_idx" ON "task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "user_tasks_task_idx" ON "user_tasks" USING btree ("task_id");--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "type";
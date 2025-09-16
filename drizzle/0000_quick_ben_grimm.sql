CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"description" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT',
	"version" integer DEFAULT 1 NOT NULL,
	"parent_version_id" uuid,
	"is_current_version" boolean DEFAULT true,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"commit_hash" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"author_name" varchar(150) NOT NULL,
	"author_email" varchar(200),
	"url" varchar(500),
	"branch" varchar(100),
	"committed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"type" varchar(50),
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"webhook_secret" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "project_repo_unique" UNIQUE("project_id","name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"parent_id" uuid,
	"color" varchar(7),
	"description" text,
	"usage_count" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_project_slug_unique" UNIQUE("project_id","slug")
);
--> statement-breakpoint
CREATE TABLE "task_commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"commit_id" uuid NOT NULL,
	"auto_linked" boolean DEFAULT true,
	CONSTRAINT "unique_task_commit" UNIQUE("task_id","commit_id")
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"depends_on_task_id" uuid NOT NULL,
	"dependency_type" varchar(50) DEFAULT 'BLOCKS',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_task_dependency" UNIQUE("task_id","depends_on_task_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'TODO',
	"priority" varchar(20) DEFAULT 'MEDIUM',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'Developer',
	"permissions" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_project" UNIQUE("user_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "user_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'Assignee',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_task" UNIQUE("user_id","task_id","role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"role" varchar(50) DEFAULT 'Developer',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_version_id_blocks_id_fk" FOREIGN KEY ("parent_version_id") REFERENCES "public"."blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_parent_id_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_commits" ADD CONSTRAINT "task_commits_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_commits" ADD CONSTRAINT "task_commits_commit_id_commits_id_fk" FOREIGN KEY ("commit_id") REFERENCES "public"."commits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_entity_idx" ON "activity_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "blocks_document_current_idx" ON "blocks" USING btree ("document_id","is_current_version");--> statement-breakpoint
CREATE INDEX "commits_repo_commit_idx" ON "commits" USING btree ("repo_id","commit_hash");--> statement-breakpoint
CREATE INDEX "commits_project_idx" ON "commits" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_project_status_idx" ON "tasks" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "user_projects_project_idx" ON "user_projects" USING btree ("project_id");
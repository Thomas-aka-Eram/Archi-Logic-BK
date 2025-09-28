ALTER TABLE "tags" ADD COLUMN "created_by" uuid NOT NULL;
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "domains" ADD COLUMN "created_by" uuid NOT NULL;
ALTER TABLE "domains" ADD CONSTRAINT "domains_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "task_activity" DROP CONSTRAINT "task_activity_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "task_activity" ADD CONSTRAINT "task_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
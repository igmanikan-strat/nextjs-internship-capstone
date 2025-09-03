ALTER TABLE "task_activity" DROP CONSTRAINT "task_activity_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "task_activity" ALTER COLUMN "user_id" SET DATA TYPE text;
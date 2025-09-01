ALTER TABLE "users" RENAME COLUMN "name" TO "first_name";--> statement-breakpoint
ALTER TABLE "task_activity" DROP CONSTRAINT "task_activity_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(128) NOT NULL;
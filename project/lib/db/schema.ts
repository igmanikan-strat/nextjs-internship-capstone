// lib/db/schema.ts
if (typeof window !== "undefined") {
  throw new Error("🚨 schema.ts imported in the browser!");
}

import {
  varchar,
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
  uniqueIndex,
  json,
  boolean, 
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { InferModel } from "drizzle-orm";

// Define allowed roles
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "member"]);

// --- USERS ---
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: varchar("email", { length: 256 }).notNull(),
  firstName: varchar("first_name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  username: varchar("username", { length: 256 }).notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// --- PROJECTS ---
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id") // ✅ FIXED (uuid, not text)
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (project) => ({
    ownerIdx: index("projects_owner_idx").on(project.ownerId),
  })
);

// --- LISTS ---
export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    description: text("description").notNull(),
  },
  (list) => ({
    projectIdx: index("lists_project_idx").on(list.projectId),
  })
);

// --- TASK STATUS ENUM ---
export const taskStatus = pgEnum("task_status", ["ongoing", "completed"]);

// --- TASKS ---
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    userId: uuid("user_id") // ✅ FIXED
      .notNull()
      .references(() => users.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    assigneeId: uuid("assignee_id") // ✅ FIXED
      .references(() => users.id),
    priority: integer("priority").default(1),
    dueDate: timestamp("due_date"),
    position: integer("position").notNull(),
    status: taskStatus("status").notNull().default("ongoing"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (task) => ({
    listIdx: index("tasks_list_idx").on(task.listId),
    assigneeIdx: index("tasks_assignee_idx").on(task.assigneeId),
  })
);

// --- COMMENTS ---
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id") // ✅ FIXED
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (comment) => ({
    taskIdx: index("comments_task_idx").on(comment.taskId),
    authorIdx: index("comments_author_idx").on(comment.authorId),
  })
);

// --- PROJECT MEMBERS ---
export const projectRole = pgEnum("project_role", ["admin", "manager", "member"]);

// --- PROJECT MEMBERS ---
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")  // ✅ FK to users.id
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectRole("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (m) => ({
    projectIdx: index("project_members_project_idx").on(m.projectId),
    userIdx: index("project_members_user_idx").on(m.userId),
    uniq: uniqueIndex("project_members_project_user_uniq").on(
      m.projectId,
      m.userId
    ),
  })
);

export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
}));

export const taskComments = pgTable("task_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskActivity = pgTable("task_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  userId: text("user_id"),
  action: text("action").notNull(), // e.g. "created", "status_changed", "comment_added"
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- USER SETTINGS ---
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
});

// --- NOTIFICATIONS ---
export const notificationTypeEnum = ["project_created", "list_created", "task_created"] as const;

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    listId: uuid("list_id").references(() => lists.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // optionally, you can validate with zod or custom enum
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (notification) => ({
    recipientIdx: index("notifications_recipient_idx").on(notification.recipientId),
    actorIdx: index("notifications_actor_idx").on(notification.actorId),
  })
);

// Types
export type ProjectMember = InferModel<typeof projectMembers>;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type List = InferModel<typeof lists>;
export type NewList = typeof lists.$inferInsert;

export type Task = InferModel<typeof tasks>;
export type NewTask = typeof tasks.$inferInsert;

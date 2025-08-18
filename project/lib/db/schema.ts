//lib/db/schema.ts
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
  primaryKey,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { InferModel } from "drizzle-orm";
// --- USERS ---
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  username: varchar("username", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PROJECTS ---
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (project) => ({
    ownerIdx: index('projects_owner_idx').on(project.ownerId),
  })
);

// --- LISTS ---
export const lists = pgTable(
  'lists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    title: text("title").notNull(), // ✅ this line is important
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    description: text("description").notNull(),
  },
  (list) => ({
    projectIdx: index('lists_project_idx').on(list.projectId),
  })
);

// --- TASKS ---
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    userId: text('user_id').notNull().references(() => users.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    listId: uuid('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    assigneeId: text('assignee_id').references(() => users.id),
    priority: integer('priority').default(1), // 1 = low, 2 = medium, 3 = high
    dueDate: timestamp('due_date'),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (task) => ({
    listIdx: index('tasks_list_idx').on(task.listId),
    assigneeIdx: index('tasks_assignee_idx').on(task.assigneeId),
  })
  
);

// --- COMMENTS ---
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (comment) => ({
    taskIdx: index('comments_task_idx').on(comment.taskId),
    authorIdx: index('comments_author_idx').on(comment.authorId),
  })
);

export type List = InferModel<typeof lists>; // ✅ this is for reading lists
export type NewList = typeof lists.$inferInsert; // ✅ optional: for inserting new lists

export type Task = InferModel<typeof tasks>; // ✅ for reading tasks
export type NewTask = typeof tasks.$inferInsert; // ✅ for inserting new tasks
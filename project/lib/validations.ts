//lib/validations
import { z } from "zod";

// ✅ client-side schema for form validation (no ownerId)
export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  dueDate: z
  .string()
  .refine(val => !val || /^\d{4}-\d{2}-\d{2}$/.test(val) || !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  })
  .optional()
})

// ✅ server-side schema (includes ownerId)
export const projectSchema = createProjectSchema.extend({
  ownerId: z.string().min(1, "Owner ID is required"),
})


// ✅ Task Schema
export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(), // actually Clerk ID
  listId: z.string().uuid({ message: "List ID must be a valid UUID" }),
  projectId: z.string().uuid(),
  position: z.number(),
  status: z.enum(["ongoing", "completed"]).default("ongoing"),
});

// ✅ User Schema
export const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  avatarUrl: z.string().url("Invalid image URL").optional(),
});

// ✅ List Schema
export const listSchema = z.object({
  title: z.string().min(1, "List title is required").max(100),
  projectId: z.string().uuid({ message: "Invalid project ID" }),
  order: z.number().int().min(0),
});

// ✅ Comment Schema
export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  taskId: z.string().uuid({ message: "Invalid task ID" }),
  userId: z.string().uuid({ message: "Invalid user ID" }),
});

export const createListSchema = z.object({
  title: z.string().min(1).max(50),
  projectId: z.string().uuid(),
});

export const taskUpdateSchema = taskSchema
  .partial()
  .refine(data => !!data.listId || !!data.position || !!data.title, {
    message: "At least one of listId, position, or title must be present",
  });
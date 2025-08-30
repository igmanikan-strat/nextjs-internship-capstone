  // TypeScript type definitions
  // Task 1.3: Set up project structure and folder organization

  export interface User {
    id: string
    clerkId: string
    email: string
    name: string
    createdAt: Date
    updatedAt: Date
    avatarUrl?: string;
  }

  export interface Project {
    id: string
    name: string
    description?: string
    ownerId: string
    createdAt: Date
    updatedAt: Date
    dueDate?: Date
    lists: List[]
  }

  export interface EditableProject {
    id: string
    name: string
    description?: string
    dueDate?: string // ISO date string, e.g., "2025-08-06"
  }

  export interface List {
    id: string
    name: string
    title: string
    projectId: string
    position: number
    createdAt: Date
    updatedAt: Date
    tasks: Task[]
  }

  export interface Task {
    id: string;
    title: string;
    description: string | null;
    listId: string;
    assigneeId?: string | null;
    assignee?: User | null;   // ✅ add this for UI
    priority: number | "low" | "medium" | "high" | null;
    dueDate?: Date | null;
    position: number;
    createdAt: Date | null;
    updatedAt: Date | null;
    comments?: Comment[];
    commentsCount?: number;   // ✅ derived count
    labels?: string[];        // ✅ optional tags
    projectId: string;   // added
    userId: string;      // added
    status: "ongoing" | "completed";
  }

  export interface Comment {
    id: string
    content: string
    taskId: string
    authorId: string
    createdAt: Date
    updatedAt: Date
  }

  export interface ProjectMember {
    id: string;                // membership row id (from projectMembers table)
    userId: string;            // actual user id
    username: string;          // from users table
    role: "admin" | "manager" | "member";
  }


  // types/index.ts

  // export type NewTask = {
  //   title: string
  //   description?: string
  //   projectId: string
  //   listId: string
  //   position: number
  // }


  // Note for interns: These types should match your database schema
  // Update as needed when implementing the actual database schema

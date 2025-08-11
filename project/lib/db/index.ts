// lib/db/index.ts

export { db } from "./client";

export {
  // Projects
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,

  // Lists
  getListsByProjectId,
  createList, // ✅ ADD THIS
} from "./queries";

export {
  // Tasks
  getTasksByProjectId,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from "./queries";

export type {
  List,
  NewList,
} from "./schema"; // ✅ Already included, good

// Optional: export actual schema tables
export * as schema from "./schema"; // ⬅️ Only if you need the raw tables like `schema.lists`

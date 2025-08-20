// lib/api.ts

export async function fetchListsForProject(projectId: string) {
  const res = await fetch(`/api/lists/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch lists");
  return res.json();
}

export async function fetchTasksForProject(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

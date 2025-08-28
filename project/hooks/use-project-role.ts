import { useQuery } from "@tanstack/react-query";

export function useProjectRole(projectId: string) {
  return useQuery({
    queryKey: ["project-role", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      // Simple: find current user via BE permission assumptions; alternatively, expose /role endpoint
      // For clarity, better create a dedicated endpoint:
      // return { role: "admin" | "manager" | "member" | null }
      const me = await fetch(`/api/projects/${projectId}/role`);
      if (!me.ok) throw new Error("Failed to fetch role");
      return me.json() as Promise<{ role: "admin"|"manager"|"member"|null }>;
    },
    enabled: !!projectId,
  });
}

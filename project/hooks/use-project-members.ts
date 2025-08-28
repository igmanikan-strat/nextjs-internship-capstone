// hooks/use-project-members.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Member = {
  userId: string;
  name?: string;
  email: string;
  role: string;
};

export function useProjectMembers(projectId: string) {
  return useQuery<Member[]>({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) throw new Error("Failed to load members");
      return res.json() as Promise<Member[]>; // type cast here
    },
  });
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to add member");
      return res.json() as Promise<Member>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-members", projectId] }),
  });
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove member");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-members", projectId] }),
  });
}

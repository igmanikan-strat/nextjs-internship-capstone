// hooks/use-lists.ts (client-safe)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useLists(projectId: string) {
  return useQuery({
    queryKey: ["lists", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/lists/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useCreateList(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch("/api/lists/create", {
        method: "POST",
        body: JSON.stringify({ title, projectId }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create list");
      return res.json();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["lists", projectId] })
  });
}

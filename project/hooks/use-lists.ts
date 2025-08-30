// hooks/use-lists.ts (client-safe)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { id } from "zod/v4/locales";

export function useLists(projectId: string) {
  return useQuery({
    queryKey: ["lists", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/lists/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
    enabled: !!projectId,
    refetchInterval: 2000,          // ✅ poll every 2s
    refetchOnWindowFocus: true,     // ✅ refresh on tab switch
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", projectId] }); // ✅ sync instantly
    },
  });
}

export function useUpdateList(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to update list");
      return res.json();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["lists", projectId] }),
  });
}

export function useDeleteList(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lists/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete list");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists", projectId] });
    },
  });
}

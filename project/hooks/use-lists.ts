import { pusherClient } from "@/lib/pusher-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { List } from "@/types";

export function useLists(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery<List[]>({
    queryKey: ["lists", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/lists/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch lists");
      const data = (await res.json()) as List[];
      return data.sort((a, b) => a.position - b.position);
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!projectId) return;

    const channel = pusherClient.subscribe(`project-${projectId}`);

    channel.bind("list:created", (list: List) => {
      queryClient.setQueryData(["lists", projectId], (old: List[] | undefined) =>
        [...(old || []), list].sort((a, b) => a.position - b.position)
      );
    });

    channel.bind("lists:reordered", (newLists: List[]) => {
      queryClient.setQueryData(["lists", projectId], newLists);
    });

    channel.bind("list:deleted", ({ id }: { id: string }) => {
      queryClient.setQueryData(["lists", projectId], (old: List[] | undefined) =>
        (old || []).filter((l) => l.id !== id)
      );
    });

    return () => {
      pusherClient.unsubscribe(`project-${projectId}`);
    };
  }, [projectId, queryClient]);

  return query;
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
      queryClient.invalidateQueries({ queryKey: ["lists", projectId] });
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

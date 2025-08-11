import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, projectId }: { title: string; projectId: string }) => {
      const res = await fetch("/api/lists/create", {
        method: "POST",
        body: JSON.stringify({ title, projectId }),
      });
      if (!res.ok) throw new Error("Failed to create list");
      return res.json();
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useLists(projectId: string) {
  return useQuery({
    queryKey: ["lists", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/lists/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
  });
}
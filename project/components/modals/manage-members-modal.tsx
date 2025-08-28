"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ManageMembersModalProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

type ProjectMember = {
  id: string; // membership id
  userId: string; // actual user uuid
  username: string;
  role: "admin" | "manager" | "member";
};


export function ManageMembersModal({ projectId, open, onClose }: ManageMembersModalProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");

  const { data: members = [], isLoading } = useQuery<ProjectMember[]>({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: open,
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to add member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      setUsername("");
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }), // ✅ must match
      });
      if (!res.ok) throw new Error("Failed to remove member");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    },
  });



  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl rounded-xl p-6"
        >
            <DialogHeader>
            <DialogTitle>Project Members</DialogTitle>
            </DialogHeader>

            {isLoading ? (
            <p>Loading...</p>
            ) : (
            <ul className="space-y-2">
                {members.map((m) => (
                    <li key={m.id} className="flex justify-between items-center">
                        <span>
                        {m.username}{" "}
                        <span className="text-xs text-gray-500">({m.role})</span>
                        </span>
                        <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMember.mutate({ userId: m.userId })}
                        >
                        Remove
                        </Button>
                    </li>
                    ))}

            </ul>
            )}

            {/* Add member form */}
            <div className="mt-4 space-y-2">
            <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <Button
                onClick={() => addMember.mutate()}
                disabled={addMember.isPending || !username}
            >
                Add Member
            </Button>
            </div>
        </DialogContent>
        </Dialog>

  );
}

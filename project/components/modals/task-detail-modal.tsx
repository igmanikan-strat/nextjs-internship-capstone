"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Task } from "@/types";
import { useTasks } from "@/hooks/use-tasks";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectRole } from "@/hooks/use-project-role";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  username: string;
}

interface Activity {
  id: string;
  action: string;
  metadata: any;
  createdAt: string;
  username: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function TaskDetailModal({ task, open, onClose, projectId }: TaskDetailModalProps) {
  const { updateTask } = useTasks(projectId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [status, setStatus] = useState<"ongoing" | "completed">("ongoing");

  const { data: roleData } = useProjectRole(projectId);
  const role = roleData?.role;
  const { data: members } = useProjectMembers(projectId);

  // --- Comments & Activity ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState("");

  // Populate when modal opens
  useEffect(() => {
    if (!task) return;

    setTitle(task.title);
    setDescription(task.description || "");
    setAssigneeId(task.assigneeId || null);
    setStatus(task.status ?? "ongoing");

    // Normalize priority
    if (typeof task.priority === "number") {
      const priorityMap: Record<number, "low" | "medium" | "high"> = {
        1: "low",
        2: "medium",
        3: "high",
      };
      setPriority(priorityMap[task.priority] ?? "medium");
    } else if (typeof task.priority === "string") {
      const p = task.priority.toLowerCase();
      if (p === "low" || p === "medium" || p === "high") {
        setPriority(p);
      } else {
        setPriority("medium");
      }
    } else {
      setPriority("medium");
    }


    setDueDate(task.dueDate ? new Date(task.dueDate) : null);

    // --- Fetch comments ---
    fetch(`/api/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then(setComments)
      .catch(console.error);

    // --- Fetch activity ---
    fetch(`/api/tasks/${task.id}/activity`)
      .then((res) => res.json())
      .then(setActivity)
      .catch(console.error);
  }, [task]);

  const handleSave = async () => {
    if (!task) return;

    const priorityToDb: Record<"low" | "medium" | "high", number> = {
      low: 1,
      medium: 2,
      high: 3,
    };

    try {
      await updateTask({
        id: task.id,
        title,
        description,
        priority: priority ? priorityToDb[priority] : null,
        dueDate,
        status,
        ...(role === "admin" || role === "manager" ? { assigneeId } : {}),
      });
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) throw new Error("Failed to add comment");

      const savedComment = await res.json();
      setComments([...comments, savedComment]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-900 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* --- Task Info --- */}
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
          />

          {/* Priority */}
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <Select
              value={priority}
              onValueChange={(val: "low" | "medium" | "high") => setPriority(val)}
            >
              <SelectTrigger className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-neutral-900">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm mb-1">Due Date</label>
            <Input
              type="date"
              value={dueDate ? dueDate.toISOString().slice(0, 10) : ""}
              onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm mb-1">Assignee</label>
            <Select
              value={assigneeId ?? "unassigned"}
              onValueChange={(val) => setAssigneeId(val === "unassigned" ? null : val)}
            >
              <SelectTrigger className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-neutral-900">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.username} <span className="text-xs text-gray-500">({m.role})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* mark completed or not */}
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="status"
    checked={status === "completed"}
    onChange={(e) => setStatus(e.target.checked ? "completed" : "ongoing")}
    className="w-4 h-4"
  />
  <label htmlFor="status" className="text-sm">
    {status === "completed" ? "Task Completed" : "Mark as Done"}
  </label>
</div>



          <Button onClick={handleSave}>Save Changes</Button>

          {/* --- Comments Section --- */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Comments</h3>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id}>
                  <strong>{c.username}</strong>: {c.content}
                  <em className="text-xs text-gray-400 ml-2">
                    ({new Date(c.createdAt).toLocaleString()})
                  </em>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={handleAddComment}>Add</Button>
            </div>
          </div>

          {/* --- Activity Section --- */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Activity History</h3>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {activity.map((a) => (
                  <li key={a.id}>
                    <strong>{a.username}</strong>{" "}
                    {a.action === "task_created" && "created this task"}
                    {a.action === "task_updated" && <>updated ({a.metadata?.changedFields?.join(", ")})</>}
                    {a.action === "task_deleted" && "deleted this task"}
                    {a.action === "comment_added" && <>commented (#{a.metadata.commentId})</>}
                    <em className="text-xs text-gray-400 ml-2">
                      ({new Date(a.createdAt).toLocaleString()})
                    </em>
                  </li>
                ))}
              </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

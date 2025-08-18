"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Task } from "@/types";
import { useTasks } from "@/hooks/use-tasks";

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

  // Populate when modal opens
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");

      // 🔹 Normalize priority
      if (typeof task.priority === "number") {
        const priorityMap: Record<number, "low" | "medium" | "high"> = {
          0: "low",
          1: "medium",
          2: "high",
        };
        setPriority(priorityMap[task.priority] ?? "medium");
      } else {
        setPriority(task.priority ?? "medium");
      }

      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    }
  }, [task]);


  const handleSave = async () => {
    if (!task) return;
    try {
      await updateTask({
        id: task.id,
        title,
        description,
        priority,
        dueDate,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
          />

          {/* Priority */}
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <Select value={priority} onValueChange={(val) => setPriority(val as "low" | "medium" | "high")}>
              <SelectTrigger className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                <SelectValue placeholder="Priority" />
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

          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

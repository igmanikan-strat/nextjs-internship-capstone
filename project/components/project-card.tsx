// components/project-card.tsx
"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    progress: number;
    memberCount: number;
    dueDate?: Date;
    status: "active" | "completed" | "on-hold";
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const statusColor = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    "on-hold": "bg-yellow-500",
  }[project.status];

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-outer_space-500 p-5 rounded-xl border border-french_gray-300 dark:border-payne's_gray-400 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-3 group"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {project.description || "No description"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left">
            <DropdownMenuItem onClick={() => onEdit?.(project.id)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(project.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>{project.memberCount} members</span>
        {project.dueDate && (
          <span>Due: {format(new Date(project.dueDate), "MMM d, yyyy")}</span>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <Badge className={`ml-3 ${statusColor}`}>{project.status}</Badge>
      </div>
    </div>
  );
}

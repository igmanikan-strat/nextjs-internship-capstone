"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
}

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    projects?: Project[];
  } | null;
}

export function ProjectListModal({ isOpen, onClose, user }: ProjectListModalProps) {
  if (!user) return null; // nothing to show if no user is selected

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-outer_space-500 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>{user.username}’s Projects</DialogTitle>
        </DialogHeader>

        {user.projects?.length ? (
          <ul className="list-disc pl-5 space-y-1">
            {user.projects.map((p) => (
              <li key={p.id} className="text-sm">
                {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No projects</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

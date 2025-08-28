"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { ManageMembersModal } from "@/components/modals/manage-members-modal";

export function ManageMembersButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 rounded-lg transition-colors"
      >
        <Users size={20} />
      </button>

      <ManageMembersModal
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

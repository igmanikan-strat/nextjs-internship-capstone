"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface UserManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    role: "admin" | "manager" | "member";
  };
  currentUserRole: "admin" | "manager" | "member";
  onUpdateRole: (userId: string, newRole: "admin" | "manager" | "member") => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export function UserManageModal({
  isOpen,
  onClose,
  user,
  currentUserRole,
  onUpdateRole,
  onDeleteUser,
}: UserManageModalProps) {
  const [newRole, setNewRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const canEditRole = currentUserRole === "admin" || currentUserRole === "manager";
  const canDelete = currentUserRole === "admin"; // only admins delete users company-wide

  async function handleSave() {
    if (newRole === user.role) return onClose(); // nothing changed
    setLoading(true);
    try {
      await onUpdateRole(user.id, newRole);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${user.username}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await onDeleteUser(user.id);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-outer_space-500 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Manage {user.username}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {canEditRole && (
            <div>
              <p className="text-sm font-medium mb-2">Role</p>
              <Select value={newRole} onValueChange={(val) => setNewRole(val as typeof newRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-outer_space-500 rounded-lg shadow-lg">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {canDelete && (
            <div className="border-t pt-4">
              <p className="text-sm text-red-600 mb-2">Danger Zone</p>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete User
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {canEditRole && (
            <Button onClick={handleSave} disabled={loading || newRole === user.role}>
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

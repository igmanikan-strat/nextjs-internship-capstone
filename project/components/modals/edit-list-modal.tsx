"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createListSchema } from "@/lib/validations";
import { z } from "zod";
import { useUpdateList } from "@/hooks/use-lists";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { useState } from "react";
import { useBoardStore } from "@/stores/board-store";
import { List } from "@/types";

type Props = {
  projectId: string;
  list: List;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function EditListModal({ projectId, list, open, setOpen }: Props) {
  const { mutate: updateList, isPending } = useUpdateList(projectId);
  const updateListInStore = useBoardStore((state) => state.updateList);

  const form = useForm<z.infer<typeof createListSchema>>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      title: list.title ?? list.name ?? "",
      projectId,
    },
  });

  const onSubmit = (values: z.infer<typeof createListSchema>) => {
    updateList(
      { id: list.id, title: values.title },
      {
        onSuccess: (updated) => {
          updateListInStore(updated.id, { title: updated.title });
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-white dark:bg-neutral-900">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input {...form.register("title")} placeholder="List title" />
          <Button type="submit" disabled={isPending}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

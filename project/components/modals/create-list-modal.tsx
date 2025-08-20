"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createListSchema } from "@/lib/validations";
import { z } from "zod";
import { useCreateList } from "@/hooks/use-lists";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import { useBoardStore } from "@/stores/board-store";

type Props = {
  projectId: string;
};

export function CreateListModal({ projectId }: Props) {
  const [open, setOpen] = useState(false);
  const { mutate: createList, isPending } = useCreateList(projectId);
  const addList = useBoardStore((state) => state.addList);

  const form = useForm<z.infer<typeof createListSchema>>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      title: "",
      projectId,
    },
  });

  const onSubmit = (values: z.infer<typeof createListSchema>) => {
    createList(values, {
      onSuccess: (newListFromServer) => {
        addList({
          ...newListFromServer,
          title: newListFromServer.title ?? newListFromServer.name,
          createdAt: new Date(newListFromServer.createdAt),
          updatedAt: new Date(newListFromServer.updatedAt),
        });
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">+ Add List</Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-neutral-900">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input {...form.register("title")} placeholder="List title" />
          <input type="hidden" value={projectId} {...form.register("projectId")} />
          <Button type="submit" disabled={isPending}>
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

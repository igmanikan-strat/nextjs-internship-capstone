import { screen, fireEvent, waitFor } from "@testing-library/react";
import { TaskDetailModal } from "@/components/modals/task-detail-modal";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/types";
import { renderWithClient } from "./test-utils";

jest.mock("@/hooks/use-tasks");

global.fetch = jest.fn();

describe("TaskDetailModal", () => {
  const mockUpdateTask = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    (useTasks as jest.Mock).mockReturnValue({ updateTask: mockUpdateTask });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  const task: Task = {
    id: "t1",
    title: "Test Task",
    description: "Desc",
    priority: "medium",
    projectId: "p1",
    listId: "l1",
    position: 0,
    assigneeId: "u1",
    userId: "u1",
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
    commentsCount: 0,
    labels: [],
  };

  it("renders TaskDetailModal without crashing", () => {
    renderWithClient(
      <TaskDetailModal task={task} open={true} onClose={mockOnClose} projectId="p1" />
    );

    expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();
  });

  it("renders task and allows editing", async () => {
    renderWithClient(
      <TaskDetailModal task={task} open={true} onClose={mockOnClose} projectId="p1" />
    );

    fireEvent.change(screen.getByDisplayValue("Test Task"), {
      target: { value: "Updated Task" },
    });

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Updated Task" })
      );
    });
  });
});

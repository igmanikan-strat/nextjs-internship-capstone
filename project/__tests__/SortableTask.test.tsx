import { render, screen, fireEvent } from "@testing-library/react";
import SortableTask from "@/components/SortableTask";
import { useBoardStore } from "@/stores/board-store";
import { useUserStore } from "@/stores/user-store";
import { Task } from "@/types";

jest.mock("@/stores/board-store");
jest.mock("@/stores/user-store");

describe("SortableTask", () => {
  const task: Task = {
    id: "t1",
    title: "Task 1",
    listId: "l1",
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    priority: "medium",
    projectId: "p1",
    userId: "u1",
    description: "desc",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useUserStore as unknown as jest.Mock).mockReturnValue({ role: "admin" });
  });

  it("renders task title and description", () => {
    (useBoardStore as unknown as jest.Mock).mockReturnValue({
      selectedTaskIds: new Set(),
      toggleTaskSelection: jest.fn(),
      selectSingleTask: jest.fn(),
      selectRange: jest.fn(),
      setLastSelected: jest.fn(),
      deleteTask: jest.fn(),
    });

    render(<SortableTask task={task} />);

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("desc")).toBeInTheDocument();
  });

  it("selects single task on normal checkbox click", () => {
    const selectSingleTask = jest.fn();

    (useBoardStore as unknown as jest.Mock).mockReturnValue({
      selectedTaskIds: new Set(),
      toggleTaskSelection: jest.fn(),
      selectSingleTask,
      selectRange: jest.fn(),
      setLastSelected: jest.fn(),
      deleteTask: jest.fn(),
    });

    render(<SortableTask task={task} />);
    fireEvent.click(screen.getByRole("checkbox"));

    expect(selectSingleTask).toHaveBeenCalledWith(task.id);
  });

  it("toggles task selection on ctrl+checkbox click", () => {
    const toggleTaskSelection = jest.fn();

    (useBoardStore as unknown as jest.Mock).mockReturnValue({
      selectedTaskIds: new Set(),
      toggleTaskSelection,
      selectSingleTask: jest.fn(),
      selectRange: jest.fn(),
      setLastSelected: jest.fn(),
      deleteTask: jest.fn(),
    });

    render(<SortableTask task={task} />);
    fireEvent.click(screen.getByRole("checkbox"), { ctrlKey: true });

    expect(toggleTaskSelection).toHaveBeenCalledWith(task.id, true);
  });
});

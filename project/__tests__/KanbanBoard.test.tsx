import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import KanbanBoard from "@/components/kanban-board";
import { useBoardStore } from "@/stores/board-store";
import { useLists } from "@/hooks/use-lists";
import { useTasks } from "@/hooks/use-tasks";
import { useProjectRole } from "@/hooks/use-project-role";

jest.mock("@/hooks/use-lists");
jest.mock("@/hooks/use-tasks");
jest.mock("@/hooks/use-project-role");
jest.mock("@/stores/board-store");

describe("KanbanBoard", () => {
  beforeEach(() => {
    (useLists as jest.Mock).mockReturnValue({ 
      data: [{ 
        id: "list1", 
        name: "List 1", 
        projectId: "p1", 
        position: 0, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        tasks: [] 
      }] 
    });

    (useTasks as jest.Mock).mockReturnValue({ 
      tasks: [], 
      bulkDeleteMutation: { mutate: jest.fn() } 
    });

    (useProjectRole as jest.Mock).mockReturnValue({ data: { role: "admin" } });

    (useBoardStore as unknown as jest.Mock).mockReturnValue({
      lists: [{ 
        id: "list1", 
        name: "List 1", 
        projectId: "p1", 
        position: 0, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        tasks: [] 
      }],
      tasks: [],
      setLists: jest.fn(),
      setTasks: jest.fn(),
      addList: jest.fn(),
      selectedTaskIds: new Set(),
      selectAllTasks: jest.fn(),
      clearSelection: jest.fn(),
      toggleTaskSelection: jest.fn(),
      selectSingleTask: jest.fn(),
      selectRange: jest.fn(),
      setLastSelected: jest.fn(),
      moveTasks: jest.fn(),
      moveTask: jest.fn(),
    });
  });

  it("renders board and lists", () => {
    render(<KanbanBoard projectId="p1" />);
    expect(screen.getByText("List 1")).toBeInTheDocument();
  });

  it("opens TaskDetailModal on task click", async () => {
    const tasks = [{ 
      id: "t1",
      title: "Task 1",
      listId: "list1",
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: "medium", // ✅ valid
      projectId: "p1",
      userId: "u1",
      description: "desc"
    }];

    (useBoardStore as unknown as jest.Mock).mockReturnValueOnce({
      lists: [{ 
        id: "list1", 
        name: "List 1", 
        projectId: "p1", 
        position: 0, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        tasks 
      }],
      tasks,
      setLists: jest.fn(),
      setTasks: jest.fn(),
      addList: jest.fn(),
      selectedTaskIds: new Set(),
      selectAllTasks: jest.fn(),
      clearSelection: jest.fn(),
      toggleTaskSelection: jest.fn(),
      selectSingleTask: jest.fn(),
      selectRange: jest.fn(),
      setLastSelected: jest.fn(),
      moveTasks: jest.fn(),
      moveTask: jest.fn(),
    });

    render(<KanbanBoard projectId="p1" />);
    fireEvent.click(screen.getByText("Task 1"));

    await waitFor(() => {
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });
  });
});

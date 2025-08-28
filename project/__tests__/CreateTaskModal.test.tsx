// __tests__/CreateTaskModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { useTaskModal } from "@/stores/task-modal-store";
import { useUser } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/stores/task-modal-store", () => ({
  useTaskModal: jest.fn(),
}));
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ id: "t1", title: "New Task" }) })
) as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CreateTaskModal", () => {
  beforeEach(() => {
    (useTaskModal as unknown as jest.Mock).mockReturnValue({
      isOpen: true,
      close: jest.fn(),
      projectId: "p1",
      listId: "l1",
    });
    (useUser as jest.Mock).mockReturnValue({ user: { id: "u1" } });
  });

  it("creates a task when form is submitted", async () => {
    renderWithClient(<CreateTaskModal />);

    fireEvent.change(screen.getByPlaceholderText("Task title"), {
      target: { value: "Finish report" },
    });
    fireEvent.change(screen.getByPlaceholderText("Description (optional)"), {
      target: { value: "Write Q4 report" },
    });

    fireEvent.click(screen.getByText("Create Task"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/tasks/create", expect.any(Object));
    });
  });
});

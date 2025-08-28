// __tests__/CreateListModal.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateListModal } from "@/components/modals/create-list-modal";
import { useCreateList } from "@/hooks/use-lists";
import { useBoardStore } from "@/stores/board-store";

jest.mock("@/hooks/use-lists");
jest.mock("@/stores/board-store", () => ({
  useBoardStore: jest.fn(),
}));

describe("CreateListModal", () => {
  const mockMutate = jest.fn();
  const queryClient = new QueryClient();

  beforeEach(() => {
  jest.clearAllMocks();

  (useCreateList as jest.Mock).mockImplementation(() => ({
    mutate: mockMutate,
    isPending: false,
  }));

  (useBoardStore as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ addList: jest.fn() })
  );
});


  it("opens modal and submits new list", async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateListModal projectId="p1" />
      </QueryClientProvider>
    );

    // Open modal
    await user.click(screen.getByText("+ Add List"));

    // Type list title
    await user.type(screen.getByPlaceholderText("List title"), "Backlog");

    // Click create
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Assert mutate called
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { title: "Backlog", projectId: "p1" },
        expect.any(Object)
      );
    });
  });
});


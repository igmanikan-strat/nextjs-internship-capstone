// __tests__/CreateProjectModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateProjectModal } from "@/components/modals/create-project-modal";
import { useCreateProject } from "@/hooks/use-projects";
import { useAuth } from "@clerk/nextjs";

jest.mock("@/hooks/use-projects");
jest.mock("@/clerk/nextjs", () => ({
  useAuth: jest.fn(),
}));

describe("CreateProjectModal", () => {
  const mockMutate = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    (useCreateProject as jest.Mock).mockReturnValue({ mutate: mockMutate });
    (useAuth as jest.Mock).mockReturnValue({ userId: "user123" });
  });

  it("submits project form with name, description, and due date", async () => {
    render(<CreateProjectModal open={true} onOpenChange={mockOnOpenChange} />);

    fireEvent.change(screen.getByLabelText(/Project Name/i), {
      target: { value: "Website Redesign" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Update UI" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/i), {
      target: { value: "2025-12-01" },
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          name: "Website Redesign",
          description: "Update UI",
          dueDate: new Date("2025-12-01"),
          ownerId: "user123",
        },
        expect.any(Object)
      );
    });
  });
});

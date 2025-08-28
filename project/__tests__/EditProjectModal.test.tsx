import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditProjectModal } from "@/components/modals/edit-project-modal";
import { useUpdateProject } from "@/hooks/use-projects";
import { useQueryClient } from "@tanstack/react-query";

jest.mock("@/hooks/use-projects");
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}));

describe("EditProjectModal", () => {
  const mockMutate = jest.fn();
  const mockInvalidateQueries = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    (useUpdateProject as jest.Mock).mockReturnValue({ mutate: mockMutate });
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
  });

  it("renders and updates project", async () => {
    const project = { id: "p1", name: "Website", description: "Desc", dueDate: "2025-12-01" };
    render(<EditProjectModal project={project} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: "Website Updated" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { id: "p1", data: expect.objectContaining({ name: "Website Updated" }) },
        expect.any(Object)
      );
    });
  });
});

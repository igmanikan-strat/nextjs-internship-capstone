import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ManageMembersModal } from "@/components/modals/manage-members-modal";
import { useQueryClient } from "@tanstack/react-query";

global.fetch = jest.fn();

describe("ManageMembersModal", () => {
  const mockOnClose = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ id: "m1", userId: "u1", username: "Alice", role: "member" }],
    });
  });

  it("renders members and adds/removes members", async () => {
    render(<ManageMembersModal projectId="p1" open={true} onClose={mockOnClose} />);

    // Wait for fetch
    await waitFor(() => screen.getByText("Alice"));

    // Add a member
    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByText("Add Member"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/projects/p1/members", expect.any(Object));
    });

    // Remove a member
    fireEvent.click(screen.getByText("Remove"));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/projects/p1/members", expect.any(Object));
    });
  });
});

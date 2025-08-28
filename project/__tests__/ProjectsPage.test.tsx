// __tests__/ProjectsPage.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectsPage from "@/app/(dashboard)/projects/page";
import { useProjects, useDeleteProject } from "@/hooks/use-projects";

// Mock hooks
jest.mock("@/hooks/use-projects");

const mockProjects = [
  { id: "1", name: "Website Redesign", description: "Update UI", dueDate: "2025-12-01" },
  { id: "2", name: "Mobile App", description: "Build React Native app", dueDate: "2025-11-15" },
];

describe("ProjectsPage", () => {
  beforeEach(() => {
    (useProjects as jest.Mock).mockReturnValue({ data: mockProjects, isLoading: false });
    (useDeleteProject as jest.Mock).mockReturnValue({ mutate: jest.fn() });
  });

  it("renders project titles", () => {
    render(<ProjectsPage />);
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
  });

  it("filters projects when searching", () => {
    render(<ProjectsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "Website" },
    });
    expect(screen.getByText("Website Redesign")).toBeInTheDocument();
    expect(screen.queryByText("Mobile App")).not.toBeInTheDocument();
  });

  it("shows empty message if no projects match search", () => {
    render(<ProjectsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "Nonexistent" },
    });
    expect(screen.getByText("No projects found.")).toBeInTheDocument();
  });
});

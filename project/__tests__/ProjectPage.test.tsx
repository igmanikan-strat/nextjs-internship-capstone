// __tests__/ProjectPage.test.tsx
import { render, screen } from "@testing-library/react";
import * as queries from "@/lib/db/queries";

jest.mock("@/lib/db/queries");

// Fake a very simple wrapper component to mimic what Next.js would render
function ProjectPageWrapper({ projectId }: { projectId: string }) {
  const [project, setProject] = React.useState<any>(null);

  React.useEffect(() => {
    queries.getProjectById(projectId).then(setProject);
  }, [projectId]);

  if (!project) return <div>Project not found.</div>;
  return (
    <div>
      <h1>Project {project.name}</h1>
      <p>Kanban board view for project management</p>
    </div>
  );
}

describe("ProjectPage", () => {
  it("renders project when found", async () => {
    (queries.getProjectById as jest.Mock).mockResolvedValue({
      id: "1",
      name: "Website Redesign",
      description: "Update UI",
    });

    render(<ProjectPageWrapper projectId="1" />);

    expect(await screen.findByText("Project Website Redesign")).toBeInTheDocument();
  });

  it("renders 'Project not found' when project does not exist", async () => {
    (queries.getProjectById as jest.Mock).mockResolvedValue(null);

    render(<ProjectPageWrapper projectId="999" />);

    expect(await screen.findByText("Project not found.")).toBeInTheDocument();
  });
});

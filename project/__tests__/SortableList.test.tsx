import { render, screen, fireEvent } from "@testing-library/react";
import SortableList from "@/components/SortableList";

describe("SortableList", () => {
  const list = { id: "l1", name: "List 1", projectId: "p1", position: 0, createdAt: new Date(), updatedAt: new Date(), tasks: [] };

  it("renders list title", () => {
    render(<SortableList list={list} />);
    expect(screen.getByText("List 1")).toBeInTheDocument();
  });

  it("calls onAddTask when Add Task button is clicked", () => {
    const onAddTask = jest.fn();
    render(<SortableList list={list} onAddTask={onAddTask}><div>Child Task</div></SortableList>);
    fireEvent.click(screen.getByText("+ Add Task"));
    expect(onAddTask).toHaveBeenCalled();
  });
});

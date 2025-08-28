import { render, screen, fireEvent, within } from "@testing-library/react"
import CalendarPage from "@/app/(dashboard)/calendar/page"

const mockTasks = [
  { id: "1", title: "Finish report", dueDate: "2025-09-01" },
  { id: "2", title: "Team meeting", dueDate: "2025-09-05" },
]

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockTasks),
    })
  ) as jest.Mock
})

describe("CalendarPage", () => {
  it("renders the header", () => {
    render(<CalendarPage />)
    expect(screen.getByText("Calendar")).toBeInTheDocument()
  })

  it("responds when clicking navigation buttons", () => {
    render(<CalendarPage />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0]) // previous
    fireEvent.click(buttons[1]) // today
    fireEvent.click(buttons[2]) // next
    expect(screen.getByText(/Calendar/i)).toBeInTheDocument()
  })

  it("renders upcoming deadlines from fetched tasks", async () => {
    render(<CalendarPage />)

    const deadlinesSection = await screen.findByText("Upcoming Deadlines")

    expect(
      within(deadlinesSection.parentElement!).getByText(/finish report/i)
    ).toBeInTheDocument()

    expect(
      within(deadlinesSection.parentElement!).getByText(/team meeting/i)
    ).toBeInTheDocument()
  })
})

"use client"

import { useEffect, useState } from "react"
// import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Plus } from "lucide-react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Calendar as BigCalendar, momentLocalizer, Navigate } from "react-big-calendar"
import { DashboardLayout } from "@/components/dashboard-layout"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar.css"


const localizer = momentLocalizer(moment)

type Task = {
  id: string
  title: string
  dueDate?: string
  priority?: string
  projectName?: string // 🔑 optional so you can display which project it belongs to
}

function CustomToolbar({ label, onNavigate }: any) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            console.log("⬅️ Prev clicked")
            onNavigate(Navigate.PREVIOUS)
          }}
          className="p-2 rounded-lg bg-platinum-200 dark:bg-outer_space-400 hover:bg-platinum-300 dark:hover:bg-outer_space-300"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => {
            console.log("📅 Today clicked")
            onNavigate(Navigate.TODAY)
          }}
          className="px-3 py-1 rounded-lg bg-blue_munsell-500 text-white hover:bg-blue_munsell-600 text-sm"
        >
          Today
        </button>
        <button
          onClick={() => {
            console.log("➡️ Next clicked")
            onNavigate(Navigate.NEXT)
          }}
          className="p-2 rounded-lg bg-platinum-200 dark:bg-outer_space-400 hover:bg-platinum-300 dark:hover:bg-outer_space-300"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Label (e.g. August 2025) */}
      <div className="flex items-center space-x-2 font-semibold text-outer_space-500 dark:text-platinum-500">
        <CalendarIcon size={18} />
        <span>{label}</span>
      </div>
    </div>
  )
}



export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<any[]>([])

  // 🔑 add date state
  const [date, setDate] = useState(new Date())

  // ✅ fetch ALL user tasks across projects
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar/tasks")
        if (!res.ok) {
          console.error("Failed to fetch tasks")
          return
        }

        const result: Task[] = await res.json()
        setTasks(result)

        const mapped = result
          .filter((t) => t.dueDate)
          .map((t) => ({
            id: t.id,
            title: t.projectName
              ? `${t.title} (${t.projectName})`
              : t.title,
            start: new Date(t.dueDate!),
            end: new Date(t.dueDate!),
            resource: t,
          }))
        setEvents(mapped)
      } catch (err) {
        console.error("Failed to fetch tasks", err)
      }
    }
    fetchEvents()
  }, [])


  // 📌 upcoming deadlines sorted
  const upcoming = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5)

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            Calendar
          </h1>
          <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
            View project deadlines and team schedules
          </p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
        <div className="h-[600px] rounded-lg overflow-hidden">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%"}}
            views={["month", "agenda"]}
            popup
            // 🔑 control date + navigation
            date={date}
            onNavigate={(newDate) => {
              console.log("📅 Navigated to:", newDate)
              setDate(newDate)
            }}
            components={{
              toolbar: (props) => (
                <CustomToolbar {...props} />
              ),
            }}
          />
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
        <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
          Upcoming Deadlines
        </h3>
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
              No upcoming deadlines 🎉
            </div>
          )}
          {upcoming.map((event, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 
                        bg-platinum-100 dark:bg-outer_space-400 
                        rounded-lg"
            >
              <div>
                <div className="font-medium text-outer_space-500 dark:text-platinum-500">
                  {event.title}
                </div>
                <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                  {event.priority ?? "Task"}
                </div>
              </div>
              <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
                {moment(event.dueDate).format("MMM D, YYYY")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
  )
}
 
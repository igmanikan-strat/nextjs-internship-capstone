//components/dashboard-layout.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "./theme-provider"
import {
  Home,
  FolderOpen,
  Users,
  Settings,
  Menu,
  X,
  BarChart3,
  Calendar,
  Bell,
  Moon,
  Sun,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Team", href: "/team", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname() // get current path
  const { user } = useUser()
  const initials =
    `${user?.firstName?.charAt(0) ?? user?.username?.charAt(0) ?? "U"}`
      .toUpperCase()
  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-platinum-900 dark:bg-outer_space-600">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-outer_space-500 border-r border-french_gray-300 dark:border-payne's_gray-400 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-french_gray-300 dark:border-payne's_gray-400">
          <Link href="/" className="text-2xl font-bold text-blue_munsell-500">
            ProjectFlow
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue_munsell-100 dark:bg-blue_munsell-900 text-blue_munsell-700 dark:text-blue_munsell-300"
                        : "text-outer_space-500 dark:text-platinum-500 hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
                    }`}
                  >
                    <item.icon className="mr-3" size={20} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-french_gray-300 dark:border-payne's_gray-400 bg-white dark:bg-outer_space-500 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
          >
            <Menu size={20} />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6"></div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-payne's_gray-400"
              onClick={() => setOpen((prev) => !prev)}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            {open && (
              <div
                ref={dropdownRef}
                className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-outer_space-500 shadow-lg rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 z-50 max-h-[60vh] overflow-y-auto"
              >
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className="p-3 border-b last:border-b-0 hover:bg-platinum-100 dark:hover:bg-outer_space-400 cursor-pointer"
                    >
                      <p className="text-sm text-outer_space-500 dark:text-platinum-500">
                        {n.message}
                      </p>
                      <p className="text-xs text-payne's_gray-500 dark:text-french_gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-center text-payne's_gray-500 dark:text-french_gray-400">
                    No notifications
                  </p>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-lg bg-platinum-500 dark:bg-payne's_gray-500 text-outer_space-500 dark:text-platinum-500 hover:bg-french_gray-500 dark:hover:bg-payne's_gray-400 transition-colors"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* User */}
            <div className="w-8 h-8 bg-blue_munsell-500 rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}

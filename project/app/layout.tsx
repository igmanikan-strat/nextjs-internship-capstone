import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// TODO: Task 2.1 - Set up Clerk authentication service
import { ClerkProvider } from "@clerk/nextjs"
// import { auth } from "@clerk/nextjs/server"
import { ThemeProvider } from "@/components/theme-provider"
import { ReactQueryProvider } from "@/app/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Project Management Tool",
  description: "Team collaboration and project management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ReactQueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

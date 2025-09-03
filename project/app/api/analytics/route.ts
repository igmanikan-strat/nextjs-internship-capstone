// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks, projects, taskActivity, users } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { startOfWeek, endOfWeek } from "date-fns";
import { auth } from "@clerk/nextjs";

export async function GET() {
  try {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const { userId: clerkId } = auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    // Now query tasks using UUID
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, dbUser.id),
    });

    // Tasks this week
    const tasksThisWeek = await db.query.tasks.findMany({
      where: (t, { gte, lte, and }) =>
        and(gte(t.createdAt!, weekStart), lte(t.createdAt!, weekEnd)),
    });


    // 🐞 Debug: log raw task data
    console.log(
    "[analytics] allTasks:",
    allTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectId: t.projectId,
    }))
    );

    const completedTasks = allTasks.filter((t) =>
      ["completed", "done"].includes(t.status?.toLowerCase() ?? "")
    );

    const pendingTasks = allTasks.filter((t) =>
      !["completed", "done"].includes(t.status?.toLowerCase() ?? "")
    );

    const completionRate =
      allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

    // Team activity
    const activeUsersThisWeek = await db
      .select({ userId: taskActivity.userId })
      .from(taskActivity)
      .where(
        and(
          gte(taskActivity.createdAt, weekStart),
          lte(taskActivity.createdAt, weekEnd)
        )
      )
      .groupBy(taskActivity.userId);

    const totalUsers = await db.query.users.findMany();

    // Project progress
    const projectData = await db.query.projects.findMany();
    const projectProgress = await Promise.all(
      projectData.map(async (p) => {
        const projectTasks = await db.query.tasks.findMany({
          where: eq(tasks.projectId, p.id),
        });
        const completed = projectTasks.filter((t) =>
          ["completed", "done"].includes(t.status?.toLowerCase() ?? "")
        ).length;
        return { name: p.name, completed, total: projectTasks.length };
      })
    );

    return NextResponse.json({
      tasksThisWeek: tasksThisWeek.length,
      completionRate,
      activeUsers: activeUsersThisWeek.length,
      inactiveUsers: totalUsers.length - activeUsersThisWeek.length,
      totalUsers: totalUsers.length,
      projectProgress,
    });
  } catch (err) {
    console.error("[analytics] GET failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

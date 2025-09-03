// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tasks, projects, taskActivity, users } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  try {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());

    // Tasks this week
    const tasksThisWeek = await db.query.tasks.findMany({
    where: (t, { gte, lte, and }) =>
        and(
        gte(t.createdAt!, weekStart),
        lte(t.createdAt!, weekEnd)
        ),
    });


    // Completion rate
    const allTasks = await db.query.tasks.findMany();
    const completedTasks = allTasks.filter(t => t.status === "completed");
    const completionRate = allTasks.length > 0
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
    const activityRate = totalUsers.length > 0
      ? activeUsersThisWeek.length / totalUsers.length
      : 0;

    // Project progress
    const projectData = await db.query.projects.findMany();
    const projectProgress = await Promise.all(
      projectData.map(async (p) => {
        const projectTasks = await db.query.tasks.findMany({
          where: eq(tasks.projectId, p.id),
        });
        const completed = projectTasks.filter(t => t.status === "completed").length;
        return { name: p.name, completed, total: projectTasks.length };
      })
    );

    return NextResponse.json({
      tasksThisWeek: tasksThisWeek.length,
      completionRate,
      activityRate,
      projectProgress,
    });
  } catch (err) {
    console.error("[analytics] GET failed:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

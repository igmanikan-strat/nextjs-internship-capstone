"use client";

import { BarChart3, TrendingUp, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";

type ProjectProgress = {
  name: string;
  completed: number;
  total: number;
};

type AnalyticsData = {
  tasksThisWeek: number;
  completionRate: number;
  activityRate: number;
  projectProgress: ProjectProgress[];
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    }
    fetchAnalytics();
  }, []);

  if (!analytics) return <DashboardLayout><p>Loading analytics...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">Analytics</h1>
          <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
            Track project performance and team productivity
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Project Velocity",
              value: analytics.tasksThisWeek,
              unit: "tasks/week",
              icon: TrendingUp,
              color: "blue",
            },
            {
              title: "Team Efficiency",
              value: `${analytics.completionRate}%`,
              unit: "completion rate",
              icon: BarChart3,
              color: "green",
            },
            {
              title: "Team Activity",
              value: `${Math.round(analytics.activityRate * 100)}%`,
              unit: "active users",
              icon: Users,
              color: "purple",
            },
          ].map((metric, i) => (
            <div
              key={i}
              className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900 rounded-lg flex items-center justify-center`}>
                  <metric.icon className={`text-${metric.color}-500`} size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold text-outer_space-500 dark:text-platinum-500 mb-1">{metric.value}</div>
              <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400 mb-2">{metric.unit}</div>
              <div className="text-xs font-medium text-outer_space-500 dark:text-platinum-500">{metric.title}</div>
            </div>
          ))}
        </div>

        {/* Project Progress Bar Graph Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
            <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">Project Progress</h3>
            <div className="h-64 bg-platinum-800 dark:bg-outer_space-400 rounded-lg flex items-center justify-center">
              <div className="text-center text-payne's_gray-500 dark:text-french_gray-400">
                <BarChart3 size={48} className="mx-auto mb-2" />
                <p>Bar Graph Placeholder</p>
                <p className="text-sm">TODO: Implement with Recharts or Chart.js</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

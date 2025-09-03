"use client";

import { BarChart3, TrendingUp, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type ProjectProgress = {
  name: string;
  completed: number;
  total: number;
};

type AnalyticsData = {
  tasksThisWeek: number;
  completionRate: number;
  activeUsers: number;
  inactiveUsers: number;
  totalUsers: number;
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

  if (!analytics) {
    return (
      <DashboardLayout>
        <p>Loading analytics...</p>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const progressData = analytics.projectProgress.map((proj) => ({
    name: proj.name,
    completed: proj.completed,
    remaining: proj.total - proj.completed,
  }));

  const activityData = [
    { name: "Active", value: analytics.activeUsers },
    { name: "Inactive", value: analytics.inactiveUsers },
  ];


  const COLORS = ["#4CAF50", "#E57373"]; // green / red

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
            Analytics
          </h1>
          <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
            Track project performance and team productivity
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              title: "Active Users",
              value: analytics.activeUsers,
              unit: "this week",
              icon: Users,
              color: "purple",
            },
          ].map((metric, i) => (
            <div
              key={i}
              className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900 rounded-lg flex items-center justify-center`}
                >
                  <metric.icon className={`text-${metric.color}-500`} size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold text-outer_space-500 dark:text-platinum-500 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400 mb-2">
                {metric.unit}
              </div>
              <div className="text-xs font-medium text-outer_space-500 dark:text-platinum-500">
                {metric.title}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress Bar Chart */}
          <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
            <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
              Project Progress
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={progressData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" stackId="a" fill="#4CAF50" />
                <Bar dataKey="remaining" stackId="a" fill="#E0E0E0" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Activity Pie Chart */}
          <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
            <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">
              Team Activity
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={(entry) => `${entry.value} ${entry.name}`}
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

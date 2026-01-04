"use client";

import React from "react";
import { useDashboardStats } from "@/hooks/useContacts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, Activity, Tag } from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Failed to load dashboard. Please try refreshing.
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const byCompany = data?.byCompany || [];
  const timeline = data?.timeline || [];

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's your contact management overview.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Contacts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Contacts</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalContacts || 0}
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* New This Week */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">This Week</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats?.newThisWeek || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    New contacts added
                  </p>
                </>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Active Tags */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Tags</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.tagStats?.length || 0}
                </p>
              )}
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Placeholder for Activities */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Activities</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
              )}
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts by Company */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contacts by Company
          </h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : byCompany.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCompany}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="company" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Tag Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tag Distribution
          </h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.tagStats && stats.tagStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.tagStats}
                  dataKey="count"
                  nameKey="tagName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.tagStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contacts Timeline (Last 30 Days)
        </h3>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="contacts"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";

type CircleHealthBadgeProps = {
  score: number;
  postsThisWeek?: number;
  jobsShared?: number;
  membersHelped?: number;
  eventsUpcoming?: number;
};

export default function CircleHealthBadge({
  score,
  postsThisWeek,
  jobsShared,
  membersHelped,
  eventsUpcoming,
}: CircleHealthBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatus = () => {
    if (score >= 80) return { label: "Very Active", color: "text-emerald-600", bg: "bg-emerald-50", icon: "🟢" };
    if (score >= 50) return { label: "Active", color: "text-amber-600", bg: "bg-amber-50", icon: "🟡" };
    if (score >= 20) return { label: "Quiet", color: "text-orange-600", bg: "bg-orange-50", icon: "🟠" };
    return { label: "Needs Attention", color: "text-red-600", bg: "bg-red-50", icon: "🔴" };
  };

  const status = getStatus();

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.color} flex items-center gap-1`}
      >
        <span>{status.icon}</span>
        <span>{status.label}</span>
      </button>

      {expanded && (postsThisWeek !== undefined || jobsShared !== undefined || membersHelped !== undefined || eventsUpcoming !== undefined) && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border bg-white p-4 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-900">Health Breakdown</div>
            {postsThisWeek !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Posts this week</span>
                <span className="font-medium">{postsThisWeek}</span>
              </div>
            )}
            {jobsShared !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Jobs shared</span>
                <span className="font-medium">{jobsShared}</span>
              </div>
            )}
            {membersHelped !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Members helped</span>
                <span className="font-medium">{membersHelped}</span>
              </div>
            )}
            {eventsUpcoming !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Upcoming events</span>
                <span className="font-medium">{eventsUpcoming}</span>
              </div>
            )}
            <div className="mt-2 border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Health Score</span>
                <span>{score}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

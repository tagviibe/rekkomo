"use client";

import { CircleLevel } from "@prisma/client";
import { TbUsers, TbClock, TbX } from "react-icons/tb";
import CircleHealthBadge from "./CircleHealthBadge";
import CircleLevelBadge from "./CircleLevelBadge";

type CircleCardProps = {
  circle: {
    id: string;
    name: string;
    level: CircleLevel;
    state: string;
    district?: string | null;
    mohalla?: string | null;
    city: string;
    memberCount: number;
    healthScore: number;
    isActive: boolean;
    lastActivityAt: Date | string;
    isMember: boolean;
    recentPosts?: number;
    recentJobs?: number;
  };
  onJoin: (circleId: string) => void;
  onLeave?: (circleId: string) => void;
  variant?: "discover" | "my-circle" | "sidebar";
};

export default function CircleCard({
  circle,
  onJoin,
  onLeave,
  variant = "discover",
}: CircleCardProps) {
  const getHeaderColor = () => {
    switch (circle.level) {
      case CircleLevel.STATE:
        return "bg-gradient-to-r from-[#0F1F6B] to-[#1a2f8a]";
      case CircleLevel.DISTRICT:
        return "bg-gradient-to-r from-[#2B4FD4] to-[#3d6ef5]";
      case CircleLevel.MOHALLA:
        return "bg-gradient-to-r from-[#F59E0B] to-[#f6b84d]";
      default:
        return "bg-gray-600";
    }
  };

  const getCardSize = () => {
    if (variant === "sidebar") return "p-3 text-sm";
    if (circle.level === CircleLevel.STATE) return "p-6";
    if (circle.level === CircleLevel.DISTRICT) return "p-5";
    return "p-4";
  };

  const formatLastActivity = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}hrs ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${getCardSize()}`}
    >
      <div className={`${getHeaderColor()} -m-6 mb-4 rounded-t-2xl p-4 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{circle.name}</h3>
              <CircleLevelBadge level={circle.level} />
            </div>
            <p className="mt-1 text-sm opacity-90">
              {circle.state}
              {circle.district && ` • ${circle.district}`}
              {circle.mohalla && ` • ${circle.mohalla}`}
            </p>
          </div>
          <CircleHealthBadge score={circle.healthScore} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <TbUsers className="h-4 w-4" />
            <span>{circle.memberCount.toLocaleString()} members</span>
          </div>
          <div className="flex items-center gap-2">
            <TbClock className="h-4 w-4" />
            <span>Active {formatLastActivity(circle.lastActivityAt)}</span>
          </div>
        </div>

        {circle.isMember ? (
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Active Member
            </span>
            {onLeave && (
              <button
                onClick={() => onLeave(circle.id)}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <TbX className="h-4 w-4" />
                Leave
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onJoin(circle.id)}
            className="w-full rounded-lg bg-[#2B4FD4] px-4 py-2.5 font-medium text-white hover:bg-[#1e3ba8] transition-colors"
          >
            Join Circle
          </button>
        )}
      </div>
    </div>
  );
}

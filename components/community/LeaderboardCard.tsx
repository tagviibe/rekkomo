"use client";

import { TbCrown, TbTrophy, TbAward } from "react-icons/tb";

type LeaderboardCardProps = {
  entries: Array<{
    rank: number;
    user: {
      name: string | null;
      profilePhotoUrl?: string | null;
      state: string | null;
      occupation: string | null;
    };
    category: string;
    score: number;
    badgeLabel: string;
  }>;
  month: string;
  circleId: string;
};

const categoryLabels: Record<string, string> = {
  most_helpful: "🤝 Most Helpful",
  job_connector: "💼 Job Connector",
  top_introducer: "👥 Top Introducer",
  organizer: "🎉 Best Organizer",
};

export default function LeaderboardCard({
  entries,
  month,
  circleId,
}: LeaderboardCardProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white";
    }
    if (rank === 2) {
      return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
    }
    if (rank === 3) {
      return "bg-gradient-to-br from-amber-600 to-amber-800 text-white";
    }
    return "bg-gray-100 text-gray-700";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TbCrown className="h-6 w-6" />;
    if (rank === 2) return <TbTrophy className="h-5 w-5" />;
    if (rank === 3) return <TbAward className="h-5 w-5" />;
    return null;
  };

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {categoryLabels[entries[0]?.category] || "Leaderboard"} — {month}
      </h3>
      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.user.name}
              className={`flex items-center gap-4 rounded-lg p-3 ${
                entry.rank <= 3 ? getRankStyle(entry.rank) : "bg-gray-50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                {entry.rank <= 3 ? (
                  getRankIcon(entry.rank)
                ) : (
                  <span>{entry.rank}</span>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="font-semibold">{entry.user.name || "Anonymous"}</div>
                <div className="text-sm opacity-80">
                  {entry.user.state} • {entry.user.occupation || "Member"}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {entry.badgeLabel} • Score: {entry.score}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

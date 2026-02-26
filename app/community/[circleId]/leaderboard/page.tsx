"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import LeaderboardCard from "@/components/community/LeaderboardCard";

export default function CircleLeaderboardPage() {
  const params = useParams();
  const circleId = params.circleId as string;

  const [leaderboard, setLeaderboard] = useState<any>({});
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (circleId) {
      fetchLeaderboard();
    }
  }, [circleId, month]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(
        `/api/community/circles/${circleId}/leaderboard?month=${month}`
      );
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || {});
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Monthly Leaderboard</h1>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <LeaderboardCard
            entries={leaderboard.most_helpful || []}
            month={month}
            circleId={circleId}
          />
          <LeaderboardCard
            entries={leaderboard.job_connector || []}
            month={month}
            circleId={circleId}
          />
          <LeaderboardCard
            entries={leaderboard.top_introducer || []}
            month={month}
            circleId={circleId}
          />
          <LeaderboardCard
            entries={leaderboard.organizer || []}
            month={month}
            circleId={circleId}
          />
        </div>
      </main>
    </div>
  );
}

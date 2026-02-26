"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ParichayModal from "@/components/community/ParichayModal";
import { TbSearch } from "react-icons/tb";

export default function CircleMembersPage() {
  const { data: session } = useSession();
  const params = useParams();
  const circleId = params.circleId as string;

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [parichayOpen, setParichayOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);

  useEffect(() => {
    if (circleId) {
      fetchMembers();
    }
  }, [circleId, filter, sort]);

  const fetchMembers = async () => {
    try {
      const url = new URL(`/api/community/circles/${circleId}/members`, window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (filter !== "all") url.searchParams.set("filter", filter);
      if (sort) url.searchParams.set("sort", sort);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search) {
      const timer = setTimeout(() => fetchMembers(), 300);
      return () => clearTimeout(timer);
    } else {
      fetchMembers();
    }
  }, [search]);

  const handleParichay = (member: any) => {
    setSelectedTarget(member);
    setParichayOpen(true);
  };

  const handleParichaySubmit = async (connectorId: string, note: string) => {
    try {
      const res = await fetch("/api/community/parichay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          targetId: selectedTarget.user.id,
          note,
        }),
      });
      if (res.ok) {
        setParichayOpen(false);
        alert("Introduction request sent!");
      }
    } catch (error) {
      console.error("Failed to send parichay:", error);
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
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Circle Members</h1>

        {/* Filters */}
        <div className="mb-6 space-y-4 rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <TbSearch className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or skill..."
              className="flex-1 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="all">All Members</option>
              <option value="welcome_committee">Welcome Committee</option>
              <option value="moderators">Moderators</option>
              <option value="new">New (Last 30 days)</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="trust_score">Trust Score</option>
              <option value="most_helpful">Most Helpful</option>
              <option value="recently_active">Recently Active</option>
            </select>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.length === 0 ? (
            <div className="col-span-full rounded-2xl border bg-white p-8 text-center text-gray-600">
              No members found
            </div>
          ) : (
            members.map((membership) => {
              const user = membership.user;
              const profile = user.profile || null;
              return (
                <div
                  key={membership.id}
                  className="rounded-2xl border bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="font-semibold">
                        {user.name || "Anonymous"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {profile?.profession || "Member"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {profile?.currentCity || ""} {profile?.currentCity && profile?.nativePlaceState ? "•" : ""} {profile?.nativePlaceState || ""}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          Trust: {profile?.trustScore || 0}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 rounded-lg border px-3 py-1.5 text-sm">
                          Connect
                        </button>
                        <button
                          onClick={() => handleParichay(membership)}
                          className="flex-1 rounded-lg bg-[#2B4FD4] px-3 py-1.5 text-sm font-medium text-white"
                        >
                          Get Introduced
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <ParichayModal
        isOpen={parichayOpen}
        requester={{
          id: session?.user?.id || "",
          name: session?.user?.name || null,
        }}
        target={{
          id: selectedTarget?.user?.id || "",
          name: selectedTarget?.user?.profile?.name || null,
        }}
        availableConnectors={[]} // TODO: Fetch mutual connections
        onSubmit={handleParichaySubmit}
        onClose={() => setParichayOpen(false)}
      />
    </div>
  );
}

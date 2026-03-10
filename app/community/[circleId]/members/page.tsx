"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ConnectButton from "@/components/ConnectButton";
import Link from "next/link";

type Member = {
  id: string;
  name: string | null;
  image: string | null;
  profile: {
    nativePlaceState: string | null;
    currentCity: string | null;
    profession: string | null;
  } | null;
  connectionStatus?: "CONNECTED" | "PENDING" | null;
};

export default function CircleMembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const circleId = params.circleId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "workers" | "providers">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (circleId) {
      fetchMembers();
    }
  }, [circleId, activeTab]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/community/circles/${circleId}/members`);
      if (res.ok) {
        const data = await res.json();
        console.log("Members API response:", data);
        console.log("Members count:", data.members?.length || 0);
        setMembers(data.members || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch members:", errorData.error || "Unknown error", "Status:", res.status);
        if (errorData.error === "Not a member") {
          alert("You need to join this circle first to see members.");
          router.push(`/community/${circleId}`);
        } else if (res.status === 401) {
          router.push(`/auth/signin?callback=/community/${circleId}/members`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStateEmoji = (state: string | null) => {
    if (!state) return "📍";
    switch (state) {
      case "Odisha":
        return "🌊";
      case "Uttar Pradesh":
        return "🏛️";
      case "Odisha":
        return "🌊";
      case "West Bengal":
        return "🐯";
      case "Rajasthan":
        return "🏜️";
      default:
        return "📍";
    }
  };

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name?.toLowerCase().includes(query) ||
      member.profile?.profession?.toLowerCase().includes(query) ||
      member.profile?.currentCity?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-6">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
              >
                ←
              </button>
              <h1 className="text-xl font-black text-gray-900">Circle Members</h1>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 mt-4 border-b">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 text-sm font-bold ${
                  activeTab === "all"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600"
                }`}
              >
                All ({members.length})
              </button>
              <button
                onClick={() => setActiveTab("workers")}
                className={`px-4 py-2 text-sm font-bold ${
                  activeTab === "workers"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600"
                }`}
              >
                Workers
              </button>
              <button
                onClick={() => setActiveTab("providers")}
                className={`px-4 py-2 text-sm font-bold ${
                  activeTab === "providers"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600"
                }`}
              >
                Providers
              </button>
            </div>
          </div>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">No members found</p>
            <p className="text-sm text-gray-500">
              {members.length === 0 
                ? "This circle has no members yet, or you need to join this circle first."
                : `No members match your search "${searchQuery}"`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
              >
                {/* Avatar */}
                <Link href={`/profile/${member.id}`} className="flex-shrink-0 relative">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name || "User"}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(member.name)}
                    </div>
                  )}
                  {member.connectionStatus === "CONNECTED" && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${member.id}`}
                    className="text-sm font-bold text-gray-900 hover:underline block truncate"
                  >
                    {member.name || "Unknown User"}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {member.profile?.profession && <span>{member.profile.profession}</span>}
                    {member.profile?.nativePlaceState && (
                      <>
                        {member.profile?.profession && <span> · </span>}
                        <span>
                          {getStateEmoji(member.profile.nativePlaceState)}{" "}
                          {member.profile.nativePlaceState}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Connect Button */}
                <div className="flex-shrink-0">
                  <ConnectButton userId={member.id} userName={member.name} variant="member-list" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

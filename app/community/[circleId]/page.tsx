"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import FeedPost from "@/components/community/FeedPost";
import CircleHealthBadge from "@/components/community/CircleHealthBadge";
import CircleLevelBadge from "@/components/community/CircleLevelBadge";
import { CommunityPostType } from "@prisma/client";
import { TbPlus } from "react-icons/tb";

export default function CircleDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const circleId = params.circleId as string;

  const [circle, setCircle] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"feed" | "members" | "leaderboard" | "gyaan">("feed");
  const [loading, setLoading] = useState(true);
  const [postType, setPostType] = useState<CommunityPostType | null>(null);
  const [postContent, setPostContent] = useState("");
  const [sosCategory, setSosCategory] = useState<string>("");
  const [sosUrgency, setSosUrgency] = useState<1 | 2 | 3>(3);
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetupDate, setMeetupDate] = useState("");
  const [gyaanTitle, setGyaanTitle] = useState("");
  const [gyaanCategory, setGyaanCategory] = useState("");

  useEffect(() => {
    if (circleId) {
      fetchCircle();
      fetchFeed();
    }
  }, [circleId]);

  const fetchCircle = async () => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}`);
      if (res.ok) {
        const data = await res.json();
        setCircle(data.circle);
      }
    } catch (error) {
      console.error("Failed to fetch circle:", error);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/feed`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCircle();
      }
    } catch (error) {
      console.error("Failed to join:", error);
    }
  };

  const handleLeave = async () => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/leave`, {
        method: "POST",
      });
      if (res.ok) {
        router.push("/community");
      }
    } catch (error) {
      console.error("Failed to leave:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !postType) return;

    // Validate post type specific fields
    if (postType === CommunityPostType.SOS) {
      if (!sosCategory) {
        alert("Please select an SOS category");
        return;
      }
    }
    if (postType === CommunityPostType.MEETUP) {
      if (!meetupLocation || !meetupDate) {
        alert("Please provide meetup location and date");
        return;
      }
    }
    if (postType === CommunityPostType.GYAAN) {
      if (!gyaanTitle || !gyaanCategory) {
        alert("Please provide title and category for your tip");
        return;
      }
    }

    try {
      const body: any = {
        type: postType,
        content: postContent,
      };

      if (postType === CommunityPostType.SOS) {
        body.sosCategory = sosCategory;
        body.sosUrgency = sosUrgency;
      }
      if (postType === CommunityPostType.MEETUP) {
        body.meetupLocation = meetupLocation;
        body.meetupDate = meetupDate;
      }
      if (postType === CommunityPostType.GYAAN) {
        body.gyaanTitle = gyaanTitle;
        body.gyaanCategory = gyaanCategory;
      }

      const res = await fetch(`/api/community/circles/${circleId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        // Reset all fields
        setPostContent("");
        setPostType(null);
        setSosCategory("");
        setSosUrgency(3);
        setMeetupLocation("");
        setMeetupDate("");
        setGyaanTitle("");
        setGyaanCategory("");
        fetchFeed();
        alert("Post created successfully!");
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
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

  if (!circle) {
    return (
      <div className="min-h-screen bg-[#F8FAFF]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-gray-600">Circle not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl border bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{circle.name}</h1>
                <CircleLevelBadge level={circle.level} />
              </div>
              <p className="mt-1 text-gray-600">
                {circle.state}
                {circle.district && ` • ${circle.district}`}
                {circle.mohalla && ` • ${circle.mohalla}`}
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span>{circle.memberCount.toLocaleString()} members</span>
                <CircleHealthBadge score={circle.healthScore} />
              </div>
            </div>
            {circle.isMember ? (
              <button
                onClick={handleLeave}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Leave Circle
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="rounded-lg bg-[#2B4FD4] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e3ba8]"
              >
                Join Circle
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 border-b">
            {(["feed", "members", "leaderboard", "gyaan"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-[#2B4FD4] text-[#2B4FD4]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "gyaan" ? "Apna Gyaan" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Post Composer */}
        {circle.isMember && activeTab === "feed" && (
          <div className="mb-6 rounded-2xl border bg-white p-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to share?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: CommunityPostType.GENERAL, label: "💬 Post", icon: "💬" },
                  { type: CommunityPostType.SOS, label: "🚨 SOS", icon: "🚨" },
                  { type: CommunityPostType.MEETUP, label: "📍 Meetup", icon: "📍" },
                  { type: CommunityPostType.GYAAN, label: "💡 Gyaan Tip", icon: "💡" },
                ].map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => setPostType(type)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      postType === type
                        ? "bg-[#2B4FD4] text-white shadow-md"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-2">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gyaan Title (if Gyaan type) */}
            {postType === CommunityPostType.GYAAN && (
              <div className="mb-3">
                <input
                  type="text"
                  value={gyaanTitle}
                  onChange={(e) => setGyaanTitle(e.target.value)}
                  placeholder="Tip title (e.g., 'How to find affordable housing')"
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                />
                <select
                  value={gyaanCategory}
                  onChange={(e) => setGyaanCategory(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm"
                >
                  <option value="">Select category</option>
                  <option value="housing">🏠 Housing</option>
                  <option value="legal">⚖️ Legal</option>
                  <option value="health">🏥 Health</option>
                  <option value="work">💼 Work</option>
                  <option value="government">🏛️ Government</option>
                </select>
              </div>
            )}

            {/* SOS Fields (if SOS type) */}
            {postType === CommunityPostType.SOS && (
              <div className="mb-3 space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    What kind of help do you need?
                  </label>
                  <select
                    value={sosCategory}
                    onChange={(e) => setSosCategory(e.target.value)}
                    className="w-full rounded-lg border border-red-300 bg-white p-2 text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="HOUSING">🏠 Housing</option>
                    <option value="PAYMENT">💰 Payment Issue</option>
                    <option value="MEDICAL">🏥 Medical</option>
                    <option value="SAFETY">🚨 Safety</option>
                    <option value="LOAN">💵 Loan</option>
                    <option value="LEGAL">⚖️ Legal</option>
                    <option value="OTHER">❓ Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Urgency Level
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 1, label: "🚨 Critical", color: "bg-red-600" },
                      { value: 2, label: "⚠️ Urgent", color: "bg-amber-500" },
                      { value: 3, label: "ℹ️ Moderate", color: "bg-blue-500" },
                    ].map(({ value, label, color }) => (
                      <button
                        key={value}
                        onClick={() => setSosUrgency(value as 1 | 2 | 3)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors ${
                          sosUrgency === value ? color : "bg-gray-400"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Meetup Fields (if Meetup type) */}
            {postType === CommunityPostType.MEETUP && (
              <div className="mb-3 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={meetupLocation}
                    onChange={(e) => setMeetupLocation(e.target.value)}
                    placeholder="Where will the meetup be? (e.g., 'Central Park, Sector 5')"
                    className="w-full rounded-lg border border-blue-300 bg-white p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={meetupDate}
                    onChange={(e) => setMeetupDate(e.target.value)}
                    className="w-full rounded-lg border border-blue-300 bg-white p-2 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Main Content Textarea */}
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={
                postType === CommunityPostType.SOS
                  ? "Describe your situation and what help you need..."
                  : postType === CommunityPostType.MEETUP
                  ? "Tell us about the meetup..."
                  : postType === CommunityPostType.GYAAN
                  ? "Share your knowledge and tips..."
                  : `Share with ${circle.name}...`
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#2B4FD4] focus:ring-2 focus:ring-[#2B4FD4]/20"
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {postType && (
                  <span>
                    {postType === CommunityPostType.SOS && "🚨 This will notify all circle members"}
                    {postType === CommunityPostType.MEETUP && "📍 Members can RSVP to your meetup"}
                    {postType === CommunityPostType.GYAAN && "💡 Help others with your knowledge"}
                    {postType === CommunityPostType.GENERAL && "💬 Share with your community"}
                  </span>
                )}
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!postContent.trim() || !postType || 
                  (postType === CommunityPostType.SOS && !sosCategory) ||
                  (postType === CommunityPostType.MEETUP && (!meetupLocation || !meetupDate)) ||
                  (postType === CommunityPostType.GYAAN && (!gyaanTitle || !gyaanCategory))}
                className="rounded-lg bg-[#2B4FD4] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1e3ba8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "feed" && (
          <div className="space-y-4">
            {feed.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-center text-gray-600">
                No posts yet. Be the first to share!
              </div>
            ) : (
              feed.map((post) => <FeedPost key={post.id} post={post} />)
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="rounded-2xl border bg-white p-6">
            <p className="text-gray-600">Members page coming soon...</p>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="rounded-2xl border bg-white p-6">
            <p className="text-gray-600">Leaderboard page coming soon...</p>
          </div>
        )}

        {activeTab === "gyaan" && (
          <div className="rounded-2xl border bg-white p-6">
            <p className="text-gray-600">Apna Gyaan page coming soon...</p>
          </div>
        )}
      </main>

      {/* Floating Post Button (Mobile) */}
      {circle.isMember && (
        <button className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B4FD4] text-white shadow-lg lg:hidden">
          <TbPlus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

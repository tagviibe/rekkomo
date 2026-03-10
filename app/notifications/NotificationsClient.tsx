"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, UserPlus, Check, X } from "lucide-react";
import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";

type FriendRequest = {
  id: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
    profile: {
      nativePlaceState: string | null;
      currentCity: string | null;
      profession: string | null;
    } | null;
  };
  createdAt: Date | string;
};

type NotificationsClientProps = {
  initialFriendRequests: FriendRequest[];
  currentUserId: string;
};

export default function NotificationsClient({
  initialFriendRequests,
  currentUserId,
}: NotificationsClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [friendRequests, setFriendRequests] = useState(initialFriendRequests);
  const [loading, setLoading] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date: Date | string) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
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

  const handleStatusChange = (userId: string, status: "PENDING" | "ACCEPTED" | "REJECTED" | null) => {
    if (status === "ACCEPTED" || status === "REJECTED") {
      setFriendRequests((prev) => prev.filter((req) => req.sender.id !== userId));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-6" style={{ zIndex: 10 }}>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
            >
              ←
            </button>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h1>
            {friendRequests.length > 0 && (
              <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {friendRequests.length} new
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Friend Requests Section */}
      {friendRequests.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No new notifications</h3>
          <p className="text-sm text-gray-500">
            You're all caught up! New friend requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {friendRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
              style={{
                borderColor: "rgba(43, 79, 212, 0.2)",
                background: "linear-gradient(135deg, #F5F7FF, white)",
              }}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <Link
                  href={`/profile/${request.sender.id}`}
                  className="flex-shrink-0"
                >
                  {request.sender.image ? (
                    <img
                      src={request.sender.image}
                      alt={request.sender.name || "User"}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(request.sender.name)}
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href={`/profile/${request.sender.id}`}
                        className="text-sm font-bold text-gray-900 hover:underline"
                      >
                        {request.sender.name || "Unknown User"}
                      </Link>
                      <p className="text-xs text-gray-600 mt-1">
                        wants to connect with you
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        {request.sender.profile?.nativePlaceState && (
                          <span className="inline-flex items-center gap-1">
                            {getStateEmoji(request.sender.profile.nativePlaceState)}{" "}
                            {request.sender.profile.nativePlaceState}
                          </span>
                        )}
                        {request.sender.profile?.profession && (
                          <>
                            <span className="mx-1">·</span>
                            <span>{request.sender.profile.profession}</span>
                          </>
                        )}
                        {request.sender.profile?.currentCity && (
                          <>
                            <span className="mx-1">·</span>
                            <span>{request.sender.profile.currentCity}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(request.createdAt)}
                    </span>
                  </div>

                  {/* Note preview */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      "Namaste! Main {request.sender.profile?.nativePlaceState || "Odisha"} se hun,{" "}
                      {request.sender.profile?.currentCity || "Pune"} mein rehta hun. Community mein judna chahta hun."
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3">
                    <ConnectButton
                      userId={request.sender.id}
                      userName={request.sender.name}
                      variant="notification"
                      onStatusChange={(status) => handleStatusChange(request.sender.id, status)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Wifi,
  WifiOff,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  image: string | null;
  profile: {
    currentCity: string | null;
  } | null;
};

type LatestMessage = {
  id: string;
  content: string;
  isSystem: boolean;
  senderId: string;
  sender: User;
  createdAt: Date | string;
};

type Conversation = {
  id: string;
  inquiryId?: string;
  requestId?: string;
  type: "customer" | "provider" | "friend_request" | "general";
  status?: string;
  phoneRevealed?: boolean;
  updatedAt: Date | string;
  createdAt: Date | string;
  otherUser: User;
  provider?: {
    id: string;
    category: string | null;
  };
  latestMessage: LatestMessage | null;
  unreadCount: number;
};

type MessagesClientProps = {
  currentUserId: string;
};

export default function MessagesClient({ currentUserId }: MessagesClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    
    const socket = io(socketUrl, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Messages page Socket.io connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Messages page Socket.io disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("⚠️ Messages page Socket.io connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for conversation updates
    socket.on("conversation_updated", (data: { inquiryId: string; customerId: string; providerId: string }) => {
      console.log("📨 Conversation updated:", data);
      // Refresh conversations list when any conversation is updated
      fetchConversations();
    });

    // Also listen for new messages as fallback
    socket.on("new_message", (newMessage: any) => {
      console.log("📨 New message received in messages list:", newMessage);
      // Refresh conversations list
      fetchConversations();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

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

  const getCategoryIcon = (category: string | null) => {
    const icons: Record<string, string> = {
      DOCTOR: "🏥",
      ELECTRICIAN: "⚡",
      PLUMBER: "🔧",
      BARBER: "✂️",
      TUTOR: "📚",
      TAILOR: "🪡",
      TIFFIN: "🍱",
      NOTARY: "⚖️",
    };
    return icons[category || ""] || "🔧";
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.otherUser.name?.toLowerCase().includes(query) ||
      conv.latestMessage?.content.toLowerCase().includes(query) ||
      (conv.provider?.category?.toLowerCase().includes(query) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black text-gray-900">Messages</h1>
            <div className="ml-auto flex items-center gap-2">
              {isConnected ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                  <Wifi className="w-3 h-3" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <WifiOff className="w-3 h-3" />
                  Connecting...
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Start a conversation by sending an inquiry to a service provider"}
            </p>
            {!searchQuery && (
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition"
              >
                Browse Services
              </Link>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isUnread = conv.unreadCount > 0;
            const isMe = conv.latestMessage?.senderId === currentUserId;
            const categoryIcon = conv.provider ? getCategoryIcon(conv.provider.category) : "";
            
            // Create unique key combining type and id (or requestId for friend requests)
            const uniqueKey = conv.type === "friend_request" 
              ? `${conv.type}-${conv.requestId}`
              : `${conv.type}-${conv.id}`;

            // Friend request item - show accept/reject buttons (styled per design)
            if (conv.type === "friend_request") {
              return (
                <div
                  key={uniqueKey}
                  className="block px-4 py-3 hover:bg-gray-50 transition"
                  style={{
                    background: "linear-gradient(135deg, #F5F7FF, white)",
                    borderBottom: "2px solid rgba(43, 79, 212, 0.12)",
                    position: "relative",
                  }}
                >
                  {/* Unread indicator */}
                  {isUnread && (
                    <div className="absolute top-3 right-4 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {conv.otherUser.image ? (
                      <img
                        src={conv.otherUser.image}
                        alt={conv.otherUser.name || "User"}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(conv.otherUser.name)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">
                            {conv.otherUser.name || "Unknown User"}
                          </h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                            Friend Request
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(conv.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mb-2">
                        wants to connect with you
                      </p>

                      {/* Accept/Reject Buttons */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const res = await fetch(
                                `/api/friend-requests/accept/${conv.requestId}`,
                                { method: "POST" }
                              );
                              if (res.ok) {
                                fetchConversations();
                                setTimeout(() => {
                                  router.push(`/messages/${conv.otherUser.id}`);
                                }, 500);
                              } else {
                                const error = await res.json().catch(() => ({}));
                                alert(error.error || "Failed to accept friend request");
                              }
                            } catch (error) {
                              console.error("Failed to accept friend request:", error);
                              alert("Network error. Please try again.");
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                        >
                          <Check className="w-3 h-3" />
                          Accept
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const res = await fetch(
                                `/api/friend-requests/reject/${conv.requestId}`,
                                { method: "POST" }
                              );
                              if (res.ok) {
                                fetchConversations();
                              } else {
                                const error = await res.json().catch(() => ({}));
                                alert(error.error || "Failed to reject friend request");
                              }
                            } catch (error) {
                              console.error("Failed to reject friend request:", error);
                              alert("Network error. Please try again.");
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                        >
                          <X className="w-3 h-3" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Regular conversation item (styled per design)
            return (
              <Link
                key={uniqueKey}
                href={
                  conv.type === "general"
                    ? `/messages/${conv.otherUser.id}`
                    : `/services/inquiry/${conv.otherUser.id}`
                }
                className={`block px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-100 ${
                  isUnread ? "bg-blue-50/30" : ""
                }`}
                style={
                  conv.type === "customer" && conv.status === "PENDING"
                    ? {
                        background: "linear-gradient(135deg, #F5F7FF, white)",
                        borderBottom: "2px solid rgba(43, 79, 212, 0.12)",
                      }
                    : {}
                }
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {conv.otherUser.image ? (
                    <img
                      src={conv.otherUser.image}
                      alt={conv.otherUser.name || "User"}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(conv.otherUser.name)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className={`text-sm font-bold truncate ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                          {conv.otherUser.name || "Unknown User"}
                        </h3>
                        {/* Service inquiry badge */}
                        {conv.type === "customer" && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold whitespace-nowrap">
                            {conv.status === "PENDING" ? "New Inquiry" : categoryIcon}
                          </span>
                        )}
                        {conv.type === "provider" && conv.status === "PENDING" && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold whitespace-nowrap">
                            New Inquiry
                          </span>
                        )}
                        {conv.status === "AGREED" && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold whitespace-nowrap">
                            Agreed ✓
                          </span>
                        )}
                        {conv.type === "general" && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold whitespace-nowrap">
                            Connected
                          </span>
                        )}
                      </div>
                      {conv.latestMessage && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${isUnread ? "text-gray-900 font-bold" : "text-gray-400"}`}>
                          {formatTime(conv.latestMessage.createdAt)}
                        </span>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* Service context for inquiries */}
                    {conv.type === "customer" && conv.provider && (
                      <div className="text-xs text-gray-600 mb-1">
                        {categoryIcon} {conv.provider.category?.replace("_", " ") || "Service"}
                        {conv.status === "PENDING" && " · Waiting for reply"}
                        {conv.status === "AGREED" && " · Confirmed"}
                      </div>
                    )}
                    {conv.type === "provider" && conv.provider && (
                      <div className="text-xs text-gray-600 mb-1">
                        {categoryIcon} {conv.provider.category?.replace("_", " ") || "Service"}
                        {conv.status === "PENDING" && " · New"}
                        {conv.status === "AGREED" && " · Confirmed ✓"}
                      </div>
                    )}

                    {/* Latest message preview */}
                    <p className={`text-xs truncate ${isUnread ? "text-gray-900 font-semibold" : "text-gray-600"}`}>
                      {conv.latestMessage ? (
                        <>
                          {isMe && <span className="text-gray-400">You: </span>}
                          {conv.latestMessage.isSystem ? (
                            <span className="text-gray-400 italic">{conv.latestMessage.content}</span>
                          ) : (
                            conv.latestMessage.content
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">
                          {conv.type === "customer" || conv.type === "provider"
                            ? "Inquiry sent"
                            : "No messages yet"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

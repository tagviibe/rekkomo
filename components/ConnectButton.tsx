"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus, Check, Clock, MessageCircle, X } from "lucide-react";
import Link from "next/link";

type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | null;

type ConnectButtonProps = {
  userId: string;
  userName?: string | null;
  variant?: "feed" | "profile" | "member-list" | "notification";
  showMessage?: boolean;
  onStatusChange?: (status: FriendRequestStatus) => void;
};

export default function ConnectButton({
  userId,
  userName,
  variant = "feed",
  showMessage = true,
  onStatusChange,
}: ConnectButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<FriendRequestStatus>(null);
  const [isSender, setIsSender] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || userId === session.user.id) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/friend-requests/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setIsSender(data.isSender || false);
          if (onStatusChange) {
            onStatusChange(data.status);
          }
        }
      } catch (error) {
        console.error("Failed to check friend request status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [userId, session?.user?.id, onStatusChange]);

  const sendFriendRequest = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/friend-requests/${userId}`, {
        method: "POST",
      });
      if (res.ok) {
        setStatus("PENDING");
        setIsSender(true);
        if (onStatusChange) {
          onStatusChange("PENDING");
        }
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
      alert("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleMessage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    router.push(`/messages/${userId}`);
  };

  if (loading || !session?.user?.id || userId === session.user.id) {
    return null;
  }

  // Feed variant - compact buttons
  if (variant === "feed") {
    if (status === "ACCEPTED") {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold"
          >
            <Check className="w-3 h-3" />
            Connected
          </button>
          {showMessage && (
            <button
              onClick={handleMessage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
            >
              <MessageCircle className="w-3 h-3" />
              Message
            </button>
          )}
        </div>
      );
    }

    if (status === "PENDING") {
      // If user received the request, show Accept/Reject buttons
      if (!isSender) {
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch(`/api/friend-requests/${userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.friendRequest?.id) {
                      const acceptRes = await fetch(
                        `/api/friend-requests/accept/${data.friendRequest.id}`,
                        { method: "POST" }
                      );
                      if (acceptRes.ok) {
                        setStatus("ACCEPTED");
                        if (onStatusChange) {
                          onStatusChange("ACCEPTED");
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Failed to accept friend request:", error);
                  alert("Failed to accept friend request");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
            >
              <Check className="w-3 h-3" />
              Accept
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch(`/api/friend-requests/${userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.friendRequest?.id) {
                      await fetch(
                        `/api/friend-requests/reject/${data.friendRequest.id}`,
                        { method: "POST" }
                      );
                      setStatus("REJECTED");
                      if (onStatusChange) {
                        onStatusChange("REJECTED");
                      }
                    }
                  }
                } catch (error) {
                  console.error("Failed to reject friend request:", error);
                  alert("Failed to reject friend request");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition"
            >
              <X className="w-3 h-3" />
              Reject
            </button>
          </div>
        );
      }
      // If user sent the request, show "Request Sent"
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold opacity-50 cursor-not-allowed"
          >
            <Clock className="w-3 h-3" />
            Request Sent
          </button>
          {showMessage && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold opacity-50 cursor-not-allowed"
            >
              <MessageCircle className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            sendFriendRequest();
          }}
          disabled={sending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          <UserPlus className="w-3 h-3" />
          {sending ? "Sending..." : "Connect"}
        </button>
        {showMessage && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold opacity-50 cursor-not-allowed"
          >
            <MessageCircle className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Profile variant - full width prominent button
  if (variant === "profile") {
    if (status === "ACCEPTED") {
      return (
        <div className="flex items-center gap-2 w-full">
          <button
            onClick={handleMessage}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Message Friend
          </button>
        </div>
      );
    }

    if (status === "PENDING") {
      // If user received the request, show Accept/Reject buttons
      if (!isSender) {
        return (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/friend-requests/${userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.friendRequest?.id) {
                      const acceptRes = await fetch(
                        `/api/friend-requests/accept/${data.friendRequest.id}`,
                        { method: "POST" }
                      );
                      if (acceptRes.ok) {
                        setStatus("ACCEPTED");
                        if (onStatusChange) {
                          onStatusChange("ACCEPTED");
                        }
                        // Navigate to chat after accepting
                        setTimeout(() => {
                          router.push(`/messages/${userId}`);
                        }, 500);
                      }
                    }
                  }
                } catch (error) {
                  console.error("Failed to accept friend request:", error);
                  alert("Failed to accept friend request");
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition"
            >
              <Check className="w-4 h-4" />
              Accept Request
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/friend-requests/${userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.friendRequest?.id) {
                      await fetch(
                        `/api/friend-requests/reject/${data.friendRequest.id}`,
                        { method: "POST" }
                      );
                      setStatus("REJECTED");
                      if (onStatusChange) {
                        onStatusChange("REJECTED");
                      }
                    }
                  }
                } catch (error) {
                  console.error("Failed to reject friend request:", error);
                  alert("Failed to reject friend request");
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 transition"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        );
      }
      // If user sent the request, show "Request Sent"
      return (
        <div className="flex items-center gap-2 w-full">
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-700 text-sm font-bold cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            Request Sent
          </button>
          {showMessage && (
            <button
              disabled
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 text-gray-400 opacity-50 cursor-not-allowed"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={sendFriendRequest}
          disabled={sending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {sending ? "Sending..." : "🤝 Connect"}
        </button>
        {showMessage && (
          <button
            disabled
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  // Member list variant - compact pill
  if (variant === "member-list") {
    if (status === "ACCEPTED") {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold"
        >
          ✓ Connected
        </button>
      );
    }

    if (status === "PENDING") {
      // If user received the request, show Accept/Reject buttons
      if (!isSender) {
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch(`/api/friend-requests/${userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.friendRequest?.id) {
                      const acceptRes = await fetch(
                        `/api/friend-requests/accept/${data.friendRequest.id}`,
                        { method: "POST" }
                      );
                      if (acceptRes.ok) {
                        setStatus("ACCEPTED");
                        if (onStatusChange) {
                          onStatusChange("ACCEPTED");
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Failed to accept friend request:", error);
                  alert("Failed to accept friend request");
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
            >
              ✓ Accept
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const res = await fetch(`/api/friend-requests/${userId}`);
                  if (res.ok) {
                    const data = await res.json();
                    if (data.friendRequest?.id) {
                      await fetch(
                        `/api/friend-requests/reject/${data.friendRequest.id}`,
                        { method: "POST" }
                      );
                      setStatus("REJECTED");
                      if (onStatusChange) {
                        onStatusChange("REJECTED");
                      }
                    }
                  }
                } catch (error) {
                  console.error("Failed to reject friend request:", error);
                  alert("Failed to reject friend request");
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition"
            >
              ✕ Reject
            </button>
          </div>
        );
      }
      // If user sent the request, show "Request Sent"
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled
          className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold opacity-50 cursor-not-allowed"
        >
          ⏳ Request Sent
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          sendFriendRequest();
        }}
        disabled={sending}
        className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition disabled:opacity-50"
      >
        {sending ? "Sending..." : "+ Connect"}
      </button>
    );
  }

  // Notification variant - accept/reject buttons
  if (variant === "notification") {
    if (status === "PENDING" && !isSender) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/friend-requests/${userId}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.friendRequest?.id) {
                    const acceptRes = await fetch(
                      `/api/friend-requests/accept/${data.friendRequest.id}`,
                      { method: "POST" }
                    );
                    if (acceptRes.ok) {
                      setStatus("ACCEPTED");
                      if (onStatusChange) {
                        onStatusChange("ACCEPTED");
                      }
                      // Navigate to chat after accepting
                      setTimeout(() => {
                        router.push(`/messages/${userId}`);
                      }, 500);
                    }
                  }
                }
              } catch (error) {
                console.error("Failed to accept friend request:", error);
                alert("Failed to accept friend request");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/friend-requests/${userId}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.friendRequest?.id) {
                    await fetch(
                      `/api/friend-requests/reject/${data.friendRequest.id}`,
                      { method: "POST" }
                    );
                    setStatus("REJECTED");
                    if (onStatusChange) {
                      onStatusChange("REJECTED");
                    }
                  }
                }
              } catch (error) {
                console.error("Failed to reject friend request:", error);
                alert("Failed to reject friend request");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 transition"
          >
            ✕ Decline
          </button>
        </div>
      );
    }
  }

  return null;
}

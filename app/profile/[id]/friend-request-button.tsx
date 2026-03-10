"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus, Check, Clock, X } from "lucide-react";

type FriendRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | null;

export default function FriendRequestButton({
  userId,
}: {
  userId: string;
}) {
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
        }
      } catch (error) {
        console.error("Failed to check friend request status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [userId, session?.user?.id]);

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

  const handleMessage = () => {
    router.push(`/messages/${userId}`);
  };

  if (loading || !session?.user?.id || userId === session.user.id) {
    return null;
  }

  if (status === "ACCEPTED") {
    return (
      <button
        onClick={handleMessage}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition"
      >
        <Check className="w-4 h-4" />
        Message Friend
      </button>
    );
  }

  if (status === "PENDING") {
    if (isSender) {
      return (
        <button
          disabled
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 cursor-not-allowed"
        >
          <Clock className="w-4 h-4" />
          Request Sent
        </button>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
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
                    }
                  }
                }
              } catch (error) {
                console.error("Failed to accept friend request:", error);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition"
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
                  }
                }
              } catch (error) {
                console.error("Failed to reject friend request:", error);
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }
  }

  return (
    <button
      onClick={sendFriendRequest}
      disabled={sending}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition disabled:opacity-50"
    >
      <UserPlus className="w-4 h-4" />
      {sending ? "Sending..." : "Send Friend Request"}
    </button>
  );
}

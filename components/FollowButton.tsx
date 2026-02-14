"use client";

import { useEffect, useState } from "react";

export default function FollowButton({ userId }: { userId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/follow/status/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(Boolean(data.isFollowing));
      }
    };
    load();
  }, [userId]);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch(`/api/follow/${userId}`, {
      method: isFollowing ? "DELETE" : "POST",
    });
    if (res.ok) {
      setIsFollowing(!isFollowing);
    }
    setLoading(false);
  };

  return (
    <button
      className={`rounded-lg px-3 py-1 text-xs ${
        isFollowing ? "border bg-white" : "bg-blue-600 text-white"
      }`}
      onClick={toggle}
      disabled={loading}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}

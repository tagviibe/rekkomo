"use client";

import { useEffect, useState } from "react";

export default function FollowButton({
  userId,
  allowFollow,
}: {
  userId: string;
  allowFollow: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!allowFollow) {
      setError("Follow disabled");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/follow/${userId}`, {
      method: isFollowing ? "DELETE" : "POST",
    });
    if (res.ok) {
      setIsFollowing(!isFollowing);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Action failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        className={`rounded-lg px-4 py-2 text-sm ${
          isFollowing ? "border bg-white" : "bg-blue-600 text-white"
        }`}
        onClick={toggle}
        disabled={loading}
      >
        {loading ? "..." : isFollowing ? "Following" : "Follow"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

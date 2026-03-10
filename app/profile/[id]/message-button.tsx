"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";

export default function MessageButton({
  userId,
}: {
  userId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id || userId === session.user.id) {
      setLoading(false);
      return;
    }

    const checkConnection = async () => {
      try {
        // Check if following
        const followRes = await fetch(`/api/follow/status/${userId}`);
        if (followRes.ok) {
          const followData = await followRes.json();
          if (followData.isFollowing) {
            setIsConnected(true);
            setLoading(false);
            return;
          }
        }

        // Check if followed by (mutual connection)
        // We need to check if the other user follows us
        const checkMutual = await fetch(`/api/followers/${userId}`);
        if (checkMutual.ok) {
          const followersData = await checkMutual.json();
          const followsMe = followersData.items?.some(
            (f: any) => f.id === session.user.id
          );
          if (followsMe) {
            setIsConnected(true);
            setLoading(false);
            return;
          }
        }

        setIsConnected(false);
      } catch (error) {
        console.error("Failed to check connection:", error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [userId, session?.user?.id]);

  const handleMessage = () => {
    router.push(`/messages/${userId}`);
  };

  if (loading || !session?.user?.id || userId === session.user.id || !isConnected) {
    return null;
  }

  return (
    <button
      onClick={handleMessage}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition"
    >
      <MessageCircle className="w-4 h-4" />
      Message
    </button>
  );
}

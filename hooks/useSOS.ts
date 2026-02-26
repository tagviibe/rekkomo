import { useState, useEffect } from "react";
import { SOSCategory } from "@prisma/client";

export function useSOS(circleId: string) {
  const [openSOS, setOpenSOS] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (circleId) {
      fetchOpenSOS();
    }
  }, [circleId]);

  const fetchOpenSOS = async () => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/feed?type=SOS`);
      if (res.ok) {
        const data = await res.json();
        setOpenSOS(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch SOS:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSOS = async (data: {
    category: SOSCategory;
    urgency: 1 | 2 | 3;
    content: string;
  }) => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SOS",
          content: data.content,
          sosCategory: data.category,
          sosUrgency: data.urgency,
        }),
      });
      if (res.ok) {
        await fetchOpenSOS();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to create SOS:", error);
      return false;
    }
  };

  const respondToSOS = async (data: {
    sosId: string;
    message: string;
    shareContact: boolean;
  }) => {
    try {
      const res = await fetch(`/api/community/sos/${data.sosId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: data.message,
          shareContact: data.shareContact,
        }),
      });
      if (res.ok) {
        await fetchOpenSOS();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to respond to SOS:", error);
      return false;
    }
  };

  return {
    openSOS,
    createSOS,
    respondToSOS,
    loading,
    refetch: fetchOpenSOS,
  };
}

import { useState, useEffect } from "react";
import { CircleLevel } from "@prisma/client";

export function useCommunity() {
  const [myCircles, setMyCircles] = useState<any[]>([]);
  const [discoverCircles, setDiscoverCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const res = await fetch("/api/community/circles");
      if (res.ok) {
        const data = await res.json();
        const all = [
          ...(data.circles.STATE || []),
          ...(data.circles.DISTRICT || []),
          ...(data.circles.MOHALLA || []),
        ];
        setMyCircles(all.filter((c: any) => c.isMember));
        setDiscoverCircles(all.filter((c: any) => !c.isMember));
      }
    } catch (error) {
      console.error("Failed to fetch circles:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinCircle = async (circleId: string) => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/join`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchCircles();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to join circle:", error);
      return false;
    }
  };

  const leaveCircle = async (circleId: string) => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/leave`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchCircles();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to leave circle:", error);
      return false;
    }
  };

  const primaryCircle = myCircles.find((c) => c.level === CircleLevel.STATE);

  return {
    myCircles,
    discoverCircles,
    joinCircle,
    leaveCircle,
    primaryCircle,
    loading,
    refetch: fetchCircles,
  };
}

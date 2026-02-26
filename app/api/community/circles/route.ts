import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { CircleLevel } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");

  // Get user's profile to determine their city/state
  const userProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { currentCity: true, nativePlaceState: true },
  });

  const targetCity = city || userProfile?.currentCity;
  if (!targetCity) {
    return NextResponse.json({ error: "City required" }, { status: 400 });
  }

  // Auto-create STATE circle for user's native state if it doesn't exist
  const nativeState = userProfile?.nativePlaceState;
  if (nativeState) {
    const { getOrCreateStateCircle } = await import("@/lib/circle-utils");
    try {
      await getOrCreateStateCircle(nativeState, targetCity);
    } catch (error) {
      console.error("Error creating state circle:", error);
    }
  }

  // Find all circles in the user's city
  const circles = await prisma.circle.findMany({
    where: {
      city: targetCity,
      ...(state ? { state } : {}),
    },
    include: {
      _count: {
        select: {
          memberships: true,
          posts: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      },
    },
    orderBy: [
      { level: "asc" }, // STATE first, then DISTRICT, then MOHALLA
      { memberCount: "desc" },
    ],
  });

  // Get user's memberships
  const userMemberships = await prisma.circleMembership.findMany({
    where: { userId: session.user.id },
    select: { circleId: true },
  });
  const memberCircleIds = new Set(userMemberships.map((m) => m.circleId));

  // Mark which circles user is a member of
  const circlesWithMembership = circles.map((circle) => ({
    ...circle,
    isMember: memberCircleIds.has(circle.id),
    recentPosts: circle._count.posts,
  }));

  // Group by level
  const grouped = {
    STATE: circlesWithMembership.filter((c) => c.level === CircleLevel.STATE),
    DISTRICT: circlesWithMembership.filter((c) => c.level === CircleLevel.DISTRICT),
    MOHALLA: circlesWithMembership.filter((c) => c.level === CircleLevel.MOHALLA),
  };

  return NextResponse.json({ circles: grouped });
}

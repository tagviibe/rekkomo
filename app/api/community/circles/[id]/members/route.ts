import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const filter = searchParams.get("filter"); // all | welcome_committee | moderators | new
  const sort = searchParams.get("sort"); // trust_score | most_helpful | recently_active | newest

  // Verify user is a member
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const where: any = {
    circleId: params.id,
  };

  if (filter === "welcome_committee") {
    where.isWelcomeCommittee = true;
  } else if (filter === "moderators") {
    where.user = {
      circleModerators: {
        some: {
          circleId: params.id,
          isActive: true,
        },
      },
    };
  } else if (filter === "new") {
    where.joinedAt = {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }

  let orderBy: any = { joinedAt: "desc" };
  if (sort === "trust_score") {
    orderBy = { user: { profile: { trustScore: "desc" } } };
  } else if (sort === "most_helpful") {
    orderBy = { helpCount: "desc" };
  } else if (sort === "recently_active") {
    orderBy = { lastActiveAt: "desc" };
  }

        const limit = parseInt(searchParams.get("limit") || "100");
        
        const memberships = await prisma.circleMembership.findMany({
          where,
          take: limit,
          include: {
      user: {
        include: {
          profile: {
            select: {
              nativePlaceState: true,
              nativePlaceCity: true,
              currentCity: true,
              currentLocality: true,
              profession: true,
              trustScore: true,
            },
          },
        },
      },
    },
    orderBy,
  });

  // Filter by search if provided
  let filtered = memberships;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = memberships.filter((m) => {
      const name = m.user.name || "";
      const occupation = m.user.profile?.profession || "";
      return (
        name.toLowerCase().includes(searchLower) ||
        occupation.toLowerCase().includes(searchLower)
      );
    });
  }

  // Get friend request statuses for all members
  const userIds = filtered.map((m) => m.user.id);
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        {
          senderId: session.user.id,
          receiverId: { in: userIds },
        },
        {
          senderId: { in: userIds },
          receiverId: session.user.id,
        },
      ],
    },
  });

  const friendRequestMap = new Map<string, { status: string; isSender: boolean }>();
  friendRequests.forEach((req) => {
    if (req.senderId === session.user.id) {
      friendRequestMap.set(req.receiverId, { status: req.status, isSender: true });
    } else {
      friendRequestMap.set(req.senderId, { status: req.status, isSender: false });
    }
  });

  // Transform members with friend request status
  const membersWithStatus = filtered.map((m) => {
    const frStatus = friendRequestMap.get(m.user.id);
    return {
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      profile: m.user.profile,
      connectionStatus: frStatus?.status === "ACCEPTED" ? "CONNECTED" : frStatus?.status === "PENDING" ? "PENDING" : null,
    };
  });

  return NextResponse.json({ members: membersWithStatus });
}

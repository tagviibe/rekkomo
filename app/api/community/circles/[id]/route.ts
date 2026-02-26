import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

function calculateCircleHealth(circle: any): number {
  const postsThisWeek = circle._count?.postsThisWeek || 0;
  const activeMembers = circle._count?.activeMembers || 0;
  const openSOS = circle._count?.openSOS || 0;
  const upcomingEvents = circle._count?.upcomingEvents || 0;

  let score = 0;
  score += Math.min(postsThisWeek * 5, 40);
  score += Math.min(activeMembers * 2, 30);
  score += Math.min(upcomingEvents * 10, 20);
  score -= openSOS * 5;

  return Math.max(0, Math.min(100, score));
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const circle = await prisma.circle.findUnique({
    where: { id: params.id },
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
      memberships: {
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        take: 1,
      },
      posts: {
        where: {
          isSOS: true,
          deletedAt: null,
        },
        include: {
          sos: {
            where: {
              status: "OPEN",
            },
          },
        },
      },
      meetups: {
        where: {
          meetupDate: {
            gte: new Date(),
          },
          isActive: true,
        },
        take: 5,
      },
    },
  });

  if (!circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }

  const postsThisWeek = circle._count.posts;
  const activeMembers = circle.memberships.length;
  const openSOS = circle.posts.filter((p) => p.sos?.status === "OPEN").length;
  const upcomingEvents = circle.meetups.length;

  const healthScore = calculateCircleHealth({
    _count: {
      postsThisWeek,
      activeMembers,
      openSOS,
      upcomingEvents,
    },
  });

  // Update health score in database
  await prisma.circle.update({
    where: { id: params.id },
    data: { healthScore },
  });

  // Check if user is a member
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: params.id,
        userId: session.user.id,
      },
    },
  });

  return NextResponse.json({
    circle: {
      ...circle,
      healthScore,
      isMember: !!membership,
    },
  });
}

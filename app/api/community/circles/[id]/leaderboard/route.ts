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
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7); // YYYY-MM

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

  // Get leaderboard entries for this month
  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      circleId: params.id,
      month,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              nativePlaceState: true,
              profession: true,
            },
          },
        },
      },
    },
    orderBy: [
      { category: "asc" },
      { rank: "asc" },
    ],
  });

  // Category labels mapping
  const categoryLabels: Record<string, string> = {
    most_helpful: "Most Helpful",
    job_connector: "Job Connector",
    top_introducer: "Top Introducer",
    organizer: "Top Organizer",
  };

  // Group by category
  const grouped: Record<string, any[]> = {
    most_helpful: [],
    job_connector: [],
    top_introducer: [],
    organizer: [],
  };

  entries.forEach((entry) => {
    if (grouped[entry.category]) {
      grouped[entry.category].push({
        ...entry,
        badgeLabel: categoryLabels[entry.category] || entry.category,
      });
    }
  });

  // Get top 5 for each category
  Object.keys(grouped).forEach((category) => {
    grouped[category] = grouped[category]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5);
  });

  return NextResponse.json({
    month,
    leaderboard: grouped,
  });
}

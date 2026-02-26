import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const [
      totalMembers,
      totalCommunities,
      totalPosts,
      totalCities,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.community.count({
        where: { visibility: "PUBLIC" },
      }),
      prisma.post.count(),
      prisma.community.findMany({
        where: { visibility: "PUBLIC" },
        select: { destinationCity: true },
        distinct: ["destinationCity"],
      }),
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              name: true,
              image: true,
            },
          },
          community: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
      }),
    ]);

    const uniqueCities = totalCities
      .map((c) => c.destinationCity)
      .filter((city): city is string => Boolean(city));

    return NextResponse.json({
      totalMembers,
      totalCommunities,
      totalPosts,
      totalCities: uniqueCities.length,
      cities: uniqueCities.slice(0, 10), // Top 10 cities
      recentActivity: recentActivity.map((post) => ({
        id: post.id,
        title: post.title,
        type: post.type,
        author: post.author?.name || "Member",
        authorImage: post.author?.image,
        community: post.community?.name,
        replies: post._count.comments,
        reactions: post._count.reactions,
        createdAt: post.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        totalMembers: 0,
        totalCommunities: 0,
        totalPosts: 0,
        totalCities: 0,
        cities: [],
        recentActivity: [],
      },
      { status: 200 }
    );
  }
}

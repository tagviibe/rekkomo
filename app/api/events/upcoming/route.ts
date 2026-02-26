import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getAuthSession();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "5");

  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      startsAt: {
        gte: now,
      },
    },
    include: {
      community: {
        select: {
          name: true,
          slug: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
    take: limit,
  });

  return NextResponse.json({ events });
}

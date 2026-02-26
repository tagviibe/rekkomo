import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const parichaySchema = z.object({
  connectorId: z.string(),
  targetId: z.string(),
  note: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = parichaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Check if requester and target are already connected
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerUserId_followingUserId: {
        followerUserId: session.user.id,
        followingUserId: parsed.data.targetId,
      },
    },
  });

  if (existingFollow) {
    return NextResponse.json(
      { error: "Already connected" },
      { status: 400 }
    );
  }

  // Check for existing pending request
  const existing = await prisma.parichay.findFirst({
    where: {
      requesterId: session.user.id,
      targetId: parsed.data.targetId,
      status: "PENDING",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Request already pending" },
      { status: 400 }
    );
  }

  // Check request limit (max 3 per week)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRequests = await prisma.parichay.count({
    where: {
      requesterId: session.user.id,
      createdAt: { gte: weekAgo },
    },
  });

  if (recentRequests >= 3) {
    return NextResponse.json(
      { error: "Request limit reached (3 per week)" },
      { status: 429 }
    );
  }

  // Create parichay request
  const parichay = await prisma.parichay.create({
    data: {
      requesterId: session.user.id,
      connectorId: parsed.data.connectorId,
      targetId: parsed.data.targetId,
      note: sanitizeText(parsed.data.note),
      status: "PENDING",
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
        },
      },
      target: {
        select: {
          id: true,
          name: true,
        },
      },
      connector: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // TODO: Send notification to connector

  return NextResponse.json({ parichay }, { status: 201 });
}

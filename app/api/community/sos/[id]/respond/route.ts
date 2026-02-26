import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const respondSchema = z.object({
  message: z.string().min(1),
  shareContact: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sos = await prisma.sOSRequest.findUnique({
    where: { id: params.id },
    include: {
      post: {
        include: {
          circle: true,
        },
      },
    },
  });

  if (!sos) {
    return NextResponse.json({ error: "SOS not found" }, { status: 404 });
  }

  // Check if user is a member of the circle
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: sos.post.circleId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Must be a circle member to respond" },
      { status: 403 }
    );
  }

  // Create response
  const response = await prisma.sOSResponse.create({
    data: {
      sosId: params.id,
      responderId: session.user.id,
      message: sanitizeText(parsed.data.message),
      contactShared: parsed.data.shareContact || false,
    },
    include: {
      responder: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              phone: true,
            },
          },
        },
      },
    },
  });

  // Update SOS response count
  await prisma.communityPost.update({
    where: { id: sos.postId },
    data: {
      replyCount: { increment: 1 },
    },
  });

  // Update member help count
  await prisma.circleMembership.update({
    where: { id: membership.id },
    data: {
      helpCount: { increment: 1 },
    },
  });

  // TODO: Send notification to SOS requester
  // TODO: Update leaderboard for "Most Helpful"

  return NextResponse.json({ response }, { status: 201 });
}

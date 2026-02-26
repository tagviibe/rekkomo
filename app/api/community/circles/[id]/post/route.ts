import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { CommunityPostType, SOSCategory, SOSStatus } from "@prisma/client";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const createPostSchema = z.object({
  type: z.nativeEnum(CommunityPostType),
  content: z.string().min(1),
  mediaUrls: z.array(z.string()).optional(),
  sosCategory: z.nativeEnum(SOSCategory).optional(),
  sosUrgency: z.number().min(1).max(3).optional(),
  meetupLocation: z.string().optional(),
  meetupDate: z.string().optional(),
  gyaanTitle: z.string().optional(),
  gyaanCategory: z.string().optional(),
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
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

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

  // Block WELCOME type posts from users
  if (parsed.data.type === CommunityPostType.WELCOME) {
    return NextResponse.json(
      { error: "Cannot create welcome posts" },
      { status: 403 }
    );
  }

  // Create the post
  const post = await prisma.communityPost.create({
    data: {
      circleId: params.id,
      authorId: session.user.id,
      type: parsed.data.type,
      content: sanitizeText(parsed.data.content),
      mediaUrls: parsed.data.mediaUrls || [],
      isSOS: parsed.data.type === CommunityPostType.SOS,
    },
    include: {
      author: {
        include: {
          profile: {
            select: {
              nativePlaceState: true,
              trustScore: true,
            },
          },
        },
      },
    },
  });

  // Handle SOS post
  if (parsed.data.type === CommunityPostType.SOS) {
    if (!parsed.data.sosCategory || !parsed.data.sosUrgency) {
      return NextResponse.json(
        { error: "SOS category and urgency required" },
        { status: 400 }
      );
    }

    await prisma.sOSRequest.create({
      data: {
        postId: post.id,
        requesterId: session.user.id,
        category: parsed.data.sosCategory,
        urgency: parsed.data.sosUrgency,
        status: SOSStatus.OPEN,
      },
    });

    // TODO: Trigger notifications to all circle members
  }

  // Handle Meetup post
  if (parsed.data.type === CommunityPostType.MEETUP) {
    if (!parsed.data.meetupLocation || !parsed.data.meetupDate) {
      return NextResponse.json(
        { error: "Meetup location and date required" },
        { status: 400 }
      );
    }

    await prisma.meetup.create({
      data: {
        circleId: params.id,
        postId: post.id,
        organizerId: session.user.id,
        title: parsed.data.content.substring(0, 100),
        location: parsed.data.meetupLocation,
        meetupDate: new Date(parsed.data.meetupDate),
      },
    });
  }

  // Handle Gyaan post
  if (parsed.data.type === CommunityPostType.GYAAN) {
    if (!parsed.data.gyaanTitle || !parsed.data.gyaanCategory) {
      return NextResponse.json(
        { error: "Gyaan title and category required" },
        { status: 400 }
      );
    }

    await prisma.gyaanEntry.create({
      data: {
        circleId: params.id,
        postId: post.id,
        authorId: session.user.id,
        title: parsed.data.gyaanTitle,
        category: parsed.data.gyaanCategory,
      },
    });
  }

  // Update circle activity
  await prisma.circle.update({
    where: { id: params.id },
    data: { lastActivityAt: new Date() },
  });

  // Update member post count
  await prisma.circleMembership.update({
    where: { id: membership.id },
    data: {
      postCount: { increment: 1 },
      lastActiveAt: new Date(),
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}

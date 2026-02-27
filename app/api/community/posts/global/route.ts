import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { CommunityPostType, SOSCategory, SOSStatus, CommunityType } from "@prisma/client";
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

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Get user's profile to determine city for global posts
  const userProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { currentCity: true, currentState: true },
  });

  const city = userProfile?.currentCity || "Global";
  const state = userProfile?.currentState || "";
  const globalSlug = `global-${city.toLowerCase().replace(/\s+/g, "-")}`;

  // Find or create global community for the user's city
  let community = await prisma.community.findUnique({
    where: { slug: globalSlug },
  });

  if (!community) {
    community = await prisma.community.create({
      data: {
        name: `Global — ${city}`,
        slug: globalSlug,
        type: CommunityType.GLOBAL,
        destinationCity: city,
        destinationState: state,
        destinationCountry: "India",
        visibility: "PUBLIC",
        description: `Global community for posts in ${city}`,
      },
    });
  }

  // Auto-join user to global community if not already a member
  const existingMember = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId: session.user.id,
        communityId: community.id,
      },
    },
  });

  if (!existingMember) {
    await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
        status: "APPROVED",
      },
    });
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: { increment: 1 } },
    });
  }

  // Find or create a circle for the city (for global posts)
  const { getOrCreateStateCircle } = await import("@/lib/circle-utils");
  let circle = null;
  try {
    const circleId = await getOrCreateStateCircle(state || "Global", city);
    circle = await prisma.circle.findUnique({
      where: { id: circleId },
    });
  } catch (err) {
    console.warn("Could not create circle for global post:", err);
  }

  if (!circle) {
    return NextResponse.json(
      { error: "Could not create or find circle for global post" },
      { status: 500 }
    );
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
      circleId: circle.id,
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
        circleId: circle.id,
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
        circleId: circle.id,
        postId: post.id,
        authorId: session.user.id,
        title: parsed.data.gyaanTitle,
        category: parsed.data.gyaanCategory,
      },
    });
  }

  // Update circle activity
  await prisma.circle.update({
    where: { id: circle.id },
    data: { lastActivityAt: new Date() },
  });

  return NextResponse.json({ post }, { status: 201 });
}

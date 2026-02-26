import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";
import { CommunityType } from "@prisma/client";

const WINDOW_MS = 60_000;
const LIMIT = 20;

const createEventSchema = z.object({
  communityId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  startsAt: z.string(), // ISO date string
  location: z.string().optional(),
  onlineLink: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const limit = rateLimit(`event:create:${ip}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid body", 
        details: parsed.error.errors 
      }, { status: 400 });
    }

    const data = parsed.data;

    // Get user's profile to determine city for global events
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { currentCity: true, currentState: true },
    });

    let targetCommunityId = data.communityId;
    let community;

    // If no communityId provided, create or get a global community for the user's city
    if (!targetCommunityId) {
      const city = userProfile?.currentCity || "Global";
      const state = userProfile?.currentState || "";
      const globalSlug = `global-${city.toLowerCase().replace(/\s+/g, "-")}`;
      
      // Find or create global community
      community = await prisma.community.findUnique({
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
            description: `Global community for events in ${city}`,
          },
        });
      }

      targetCommunityId = community.id;

      // Auto-join user to global community if not already a member
      const existingMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: targetCommunityId,
          },
        },
      });

      if (!existingMember) {
        await prisma.communityMember.create({
          data: {
            userId: session.user.id,
            communityId: targetCommunityId,
            status: "APPROVED",
          },
        });
        await prisma.community.update({
          where: { id: targetCommunityId },
          data: { memberCount: { increment: 1 } },
        });
      }
    } else {
      // Verify user is a member of the specified community
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: targetCommunityId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You must be a member of this community to create events" },
          { status: 403 }
        );
      }

      // Get the community
      community = await prisma.community.findUnique({
        where: { id: targetCommunityId },
      });

      if (!community) {
        return NextResponse.json(
          { error: "Community not found" },
          { status: 404 }
        );
      }
    }

    // Find the matching Circle based on state and city (only for state circles)
    let circle = null;
    if (community.type === CommunityType.STATE_CIRCLE) {
      circle = await prisma.circle.findFirst({
        where: {
          state: community.originState || "",
          city: community.destinationCity || "",
          level: "STATE",
        },
      });
    } else if (community.type === CommunityType.GLOBAL) {
      // For global events, find or create a circle for the city
      const { getOrCreateStateCircle } = await import("@/lib/circle-utils");
      try {
        const circleId = await getOrCreateStateCircle(
          community.destinationState || "Global",
          community.destinationCity || "Global"
        );
        circle = await prisma.circle.findUnique({
          where: { id: circleId },
        });
      } catch (err) {
        console.warn("Could not create circle for global event:", err);
      }
    }

    if (!circle) {
      // If circle not found, still create the event but don't create feed post
      console.warn(`Circle not found for community ${targetCommunityId}`);
    }

    // Create the Event
    const event = await prisma.event.create({
      data: {
        communityId: targetCommunityId,
        creatorId: session.user.id,
        title: sanitizeText(data.title),
        description: data.description ? sanitizeText(data.description) : undefined,
        startsAt: new Date(data.startsAt),
        location: data.location ? sanitizeText(data.location) : undefined,
        onlineLink: data.onlineLink ? sanitizeText(data.onlineLink) : undefined,
        capacity: data.capacity,
        coverImageUrl: data.imageUrl,
      },
    include: {
      community: {
        select: {
          id: true,
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
    },
  });

    // Also create a CommunityPost with type MEETUP so it shows in the feed (if circle found)
    if (circle) {
      try {
        const postContent = data.description || data.title;
        const post = await prisma.communityPost.create({
          data: {
            circleId: circle.id,
            authorId: session.user.id,
            type: "MEETUP",
            content: sanitizeText(postContent),
            mediaUrls: data.imageUrl ? [data.imageUrl] : [],
          },
        });

        // Create the Meetup entry linked to the post
        await prisma.meetup.create({
          data: {
            circleId: circle.id,
            postId: post.id,
            organizerId: session.user.id,
            title: sanitizeText(data.title),
            location: data.location ? sanitizeText(data.location) : (data.onlineLink || "Online Event"),
            meetupDate: new Date(data.startsAt),
          },
        });
      } catch (feedError) {
        // Log error but don't fail the event creation
        console.error("Failed to create feed post for event:", feedError);
      }
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create event",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;
  const communityId = searchParams.get("communityId");

  const where: any = {};
  if (communityId) {
    where.communityId = communityId;
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        community: {
          select: {
            id: true,
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
      orderBy: { startsAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({ events, total, page, limit });
}

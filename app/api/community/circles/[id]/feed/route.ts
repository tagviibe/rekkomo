import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { CommunityPostType } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type") as CommunityPostType | null;

  const skip = (page - 1) * limit;

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

  // Build where clause
  const where: any = {
    circleId: params.id,
    deletedAt: null,
  };

  if (type) {
    where.type = type;
  }

  // Get SOS posts first (always at top)
  const sosPosts = await prisma.communityPost.findMany({
    where: {
      ...where,
      isSOS: true,
      sos: {
        status: "OPEN",
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              trustScore: true,
              nativePlaceState: true,
            },
          },
        },
      },
      sos: {
        include: {
          responses: {
            select: {
              id: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get pinned posts
  const pinnedPosts = await prisma.communityPost.findMany({
    where: {
      ...where,
      isPinned: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              trustScore: true,
              nativePlaceState: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get welcome posts (last 48 hours)
  const welcomePosts = await prisma.communityPost.findMany({
    where: {
      ...where,
      type: CommunityPostType.WELCOME,
      createdAt: {
        gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              trustScore: true,
              nativePlaceState: true,
            },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get regular posts
  const regularPosts = await prisma.communityPost.findMany({
    where: {
      ...where,
      isPinned: false,
      isSOS: false,
      type: {
        not: CommunityPostType.WELCOME,
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              trustScore: true,
              nativePlaceState: true,
            },
          },
        },
      },
      meetup: true,
      gyaanEntry: true,
      _count: {
        select: {
          likes: true,
          replies: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  // Combine: SOS first, then pinned, then welcome mixed with regular chronologically
  const allPosts = [
    ...sosPosts,
    ...pinnedPosts,
    ...welcomePosts,
    ...regularPosts,
  ];

  return NextResponse.json({
    items: allPosts,
    page,
    limit,
    hasMore: regularPosts.length === limit,
  });
}

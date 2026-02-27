import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { CommunityPostType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const typeParam = searchParams.get("type");
  const type = typeParam && typeParam !== "all" ? (typeParam as CommunityPostType) : null;

  const skip = (page - 1) * limit;

  // Build where clause - get posts from all circles
  const where: any = {
    deletedAt: null,
  };

  if (type) {
    where.type = type;
  }

  // Get SOS posts first (always at top) from all circles
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
      circle: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
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
      meetup: true,
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          coverImageUrl: true,
          community: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          payMin: true,
          payMax: true,
          location: true,
          skillCategory: true,
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
    take: 10, // Limit SOS posts
  });

  // Get pinned posts from all circles
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
      circle: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
      meetup: true,
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          coverImageUrl: true,
          community: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          payMin: true,
          payMax: true,
          location: true,
          skillCategory: true,
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
    take: 10, // Limit pinned posts
  });

  // Get welcome posts (last 48 hours) from all circles
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
      circle: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
      meetup: true,
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          coverImageUrl: true,
          community: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          payMin: true,
          payMax: true,
          location: true,
          skillCategory: true,
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
    take: 20,
  });

  // Get regular posts from all circles
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
      circle: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      },
      meetup: true,
      gyaanEntry: true,
      event: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          coverImageUrl: true,
          community: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          payMin: true,
          payMax: true,
          location: true,
          skillCategory: true,
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
    skip,
    take: limit,
  });

  // Combine: SOS first, then pinned, then welcome mixed with regular chronologically
  const allPosts = [
    ...sosPosts.map((p) => ({ ...p, likeCount: p._count?.likes || 0, replyCount: p._count?.replies || 0 })),
    ...pinnedPosts.map((p) => ({ ...p, likeCount: p._count?.likes || 0, replyCount: p._count?.replies || 0 })),
    ...welcomePosts.map((p) => ({ ...p, likeCount: p._count?.likes || 0, replyCount: p._count?.replies || 0 })),
    ...regularPosts.map((p) => ({ ...p, likeCount: p._count?.likes || 0, replyCount: p._count?.replies || 0 })),
  ];

  // Sort by createdAt descending (most recent first)
  allPosts.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return NextResponse.json({ items: allPosts, page, limit });
}

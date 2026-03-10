import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  
  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
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
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      likes: session?.user?.id
        ? {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          }
        : false,
      _count: {
        select: {
          likes: true,
          replies: true,
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
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

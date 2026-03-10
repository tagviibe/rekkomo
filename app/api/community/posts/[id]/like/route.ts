import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
    include: {
      circle: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if user is a member of the circle
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: post.circleId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Check if already liked
  const existingLike = await prisma.postLike.findUnique({
    where: {
      postId_userId: {
        postId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (existingLike) {
    // Unlike: delete the like
    await prisma.postLike.delete({
      where: {
        postId_userId: {
          postId: params.id,
          userId: session.user.id,
        },
      },
    });

    // Update like count
    await prisma.communityPost.update({
      where: { id: params.id },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({ liked: false });
  } else {
    // Like: create the like
    await prisma.postLike.create({
      data: {
        postId: params.id,
        userId: session.user.id,
      },
    });

    // Update like count
    await prisma.communityPost.update({
      where: { id: params.id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ liked: true });
  }
}

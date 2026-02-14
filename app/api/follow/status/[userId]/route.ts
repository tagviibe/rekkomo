import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ isFollowing: false });
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerUserId_followingUserId: {
        followerUserId: session.user.id,
        followingUserId: params.userId,
      },
    },
  });

  return NextResponse.json({ isFollowing: Boolean(follow) });
}

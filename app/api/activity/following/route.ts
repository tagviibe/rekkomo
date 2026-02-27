import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validators";
import { canViewProfile } from "@/lib/people";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = paginationSchema.safeParse({
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const following = await prisma.follow.findMany({
    where: { followerUserId: session.user.id },
    select: { followingUserId: true },
  });
  const followingIds = following.map((f) => f.followingUserId);
  if (followingIds.length === 0) {
    return NextResponse.json({ items: [], page, limit });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberships: { select: { communityId: true } } },
  });
  const currentCommunityIds = new Set(
    currentUser?.memberships.map((m) => m.communityId) ?? []
  );

  const posts = await prisma.post.findMany({
    where: { authorId: { in: followingIds } },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: true,
          memberships: { select: { communityId: true } },
        },
      },
      community: { select: { name: true, slug: true } },
      _count: { select: { reactions: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const filtered = posts.filter((post) => {
    const profile = post.author.profile;
    if (!profile?.showActivity) return false;
    const hasCommunityOverlap = post.author.memberships.some((m) =>
      currentCommunityIds.has(m.communityId)
    );
    return canViewProfile(profile.profileVisibility, {
      isSelf: false,
      hasCommunityOverlap,
    });
  });

  return NextResponse.json({ items: filtered, page, limit });
}

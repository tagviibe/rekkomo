import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { paginationSchema } from "@/lib/validators";
import { CommunityVisibility, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = paginationSchema.safeParse({
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const session = await getAuthSession();
  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const visibilityFilter: Prisma.PostWhereInput = session?.user?.id
    ? {
        OR: [
          { community: { is: { visibility: CommunityVisibility.PUBLIC } } },
          { community: null },
          {
            community: {
              is: { members: { some: { userId: session.user.id } } },
            },
          },
        ],
      }
    : {
        OR: [
          { community: { is: { visibility: CommunityVisibility.PUBLIC } } },
          { community: null },
        ],
      };

  const posts = await prisma.post.findMany({
    where: visibilityFilter,
    include: {
      author: { select: { id: true, name: true, image: true } },
      community: { select: { name: true, slug: true } },
      _count: { select: { reactions: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json({ items: posts, page, limit });
}

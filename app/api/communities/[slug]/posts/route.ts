import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validators";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(req.url);
  const parsed = paginationSchema.safeParse({
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
  });
  if (!community) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (community.visibility === "PRIVATE") {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const member = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    });

    if (!member || member.status !== "APPROVED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json({ items: posts, page, limit });
}

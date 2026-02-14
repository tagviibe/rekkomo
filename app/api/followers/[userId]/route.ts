import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validators";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
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

  const followers = await prisma.follow.findMany({
    where: { followingUserId: params.userId },
    include: {
      follower: {
        select: { id: true, name: true, image: true, profile: true },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: followers.map((item) => item.follower),
    page,
    limit,
  });
}

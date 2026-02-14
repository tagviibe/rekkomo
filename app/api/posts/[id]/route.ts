import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      reactions: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.communityId) {
    const community = await prisma.community.findUnique({
      where: { id: post.communityId },
    });
    if (community?.visibility === "PRIVATE") {
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
  }

  return NextResponse.json({ post });
}

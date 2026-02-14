import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reactSchema } from "@/lib/validators";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.communityId) {
    const community = await prisma.community.findUnique({
      where: { id: post.communityId },
    });
    if (community?.visibility === "PRIVATE") {
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

  const reaction = await prisma.reaction.upsert({
    where: { postId_userId: { postId: params.id, userId: session.user.id } },
    update: { type: parsed.data.type },
    create: { postId: params.id, userId: session.user.id, type: parsed.data.type },
  });

  return NextResponse.json({ reaction });
}

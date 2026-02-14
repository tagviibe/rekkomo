import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
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

  return NextResponse.json({ community });
}

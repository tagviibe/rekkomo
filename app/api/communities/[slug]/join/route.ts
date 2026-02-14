import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
  });
  if (!community) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const desiredStatus = community.visibility === "PRIVATE" ? "PENDING" : "APPROVED";

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    });

    if (!existing) {
      const member = await tx.communityMember.create({
        data: {
          userId: session.user.id,
          communityId: community.id,
          status: desiredStatus,
        },
      });

      if (desiredStatus === "APPROVED") {
        await tx.community.update({
          where: { id: community.id },
          data: { memberCount: { increment: 1 } },
        });
      }

      return member.status;
    }

    if (existing.status !== desiredStatus && desiredStatus === "APPROVED") {
      await tx.communityMember.update({
        where: { id: existing.id },
        data: { status: desiredStatus },
      });
      await tx.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return existing.status;
  });

  return NextResponse.json({ status: result });
}

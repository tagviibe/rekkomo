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

  await prisma.$transaction(async (tx) => {
    const existing = await tx.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    });

    if (!existing) return;

    await tx.communityMember.delete({ where: { id: existing.id } });

    if (existing.status === "APPROVED") {
      await tx.community.update({
        where: { id: community.id },
        data: { memberCount: { decrement: 1 } },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

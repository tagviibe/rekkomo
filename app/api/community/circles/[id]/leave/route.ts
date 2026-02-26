import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 404 });
  }

  // Delete membership
  await prisma.circleMembership.delete({
    where: { id: membership.id },
  });

  // Update circle member count
  await prisma.circle.update({
    where: { id: params.id },
    data: { memberCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}

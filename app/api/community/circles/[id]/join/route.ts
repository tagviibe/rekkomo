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

  const circle = await prisma.circle.findUnique({
    where: { id: params.id },
  });

  if (!circle) {
    return NextResponse.json({ error: "Circle not found" }, { status: 404 });
  }

  // Check if already a member
  const existing = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  // Create membership
  const membership = await prisma.circleMembership.create({
    data: {
      circleId: params.id,
      userId: session.user.id,
    },
  });

  // Update circle member count
  await prisma.circle.update({
    where: { id: params.id },
    data: { memberCount: { increment: 1 } },
  });

  // Check if this is one of the first 3 members (Welcome Committee)
  const memberCount = await prisma.circleMembership.count({
    where: { circleId: params.id },
  });

  if (memberCount <= 3) {
    await prisma.circleMembership.update({
      where: { id: membership.id },
      data: { isWelcomeCommittee: true },
    });
  }

  // TODO: Create welcome post if this is a new member
  // TODO: Send notifications to Welcome Committee

  return NextResponse.json({ membership }, { status: 201 });
}

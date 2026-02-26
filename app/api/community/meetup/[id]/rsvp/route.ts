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

  const meetup = await prisma.meetup.findUnique({
    where: { id: params.id },
    include: {
      circle: true,
    },
  });

  if (!meetup) {
    return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
  }

  // Check if user is a member
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: meetup.circleId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Must be a circle member to RSVP" },
      { status: 403 }
    );
  }

  // Check if already RSVPed
  const existing = await prisma.meetupRsvp.findUnique({
    where: {
      meetupId_userId: {
        meetupId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    // Remove RSVP
    await prisma.meetupRsvp.delete({
      where: { id: existing.id },
    });
    await prisma.meetup.update({
      where: { id: params.id },
      data: { rsvpCount: { decrement: 1 } },
    });
    return NextResponse.json({ rsvped: false });
  }

  // Create RSVP
  await prisma.meetupRsvp.create({
    data: {
      meetupId: params.id,
      userId: session.user.id,
    },
  });

  await prisma.meetup.update({
    where: { id: params.id },
    data: { rsvpCount: { increment: 1 } },
  });

  return NextResponse.json({ rsvped: true }, { status: 201 });
}

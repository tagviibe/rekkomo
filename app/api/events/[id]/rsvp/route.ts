import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rsvpSchema = z.object({
  status: z.enum(["YES", "NO"]),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Upsert RSVP
  await prisma.eventRSVP.upsert({
    where: {
      eventId_userId: {
        eventId: params.id,
        userId: session.user.id,
      },
    },
    update: {
      status: parsed.data.status,
    },
    create: {
      eventId: params.id,
      userId: session.user.id,
      status: parsed.data.status,
    },
  });

  return NextResponse.json({ ok: true });
}

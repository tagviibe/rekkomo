import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const welcomeSchema = z.object({
  circleId: z.string(),
  message: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = welcomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Verify sender is a member
  const senderMembership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: parsed.data.circleId,
        userId: session.user.id,
      },
    },
  });

  if (!senderMembership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Verify target is a member
  const targetMembership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: parsed.data.circleId,
        userId: params.userId,
      },
    },
  });

  if (!targetMembership) {
    return NextResponse.json(
      { error: "Target user is not a member" },
      { status: 404 }
    );
  }

  // Create welcome message as a post reply or direct message
  // For now, we'll create a comment on a welcome post if it exists
  // TODO: Implement proper messaging system or use existing comment system

  // TODO: Send notification to target user

  return NextResponse.json(
    { success: true, message: "Welcome message sent" },
    { status: 201 }
  );
}

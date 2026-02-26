import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const createMeetupSchema = z.object({
  circleId: z.string(),
  title: z.string().min(1),
  location: z.string().min(1),
  meetupDate: z.string(),
  content: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createMeetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Verify user is a member
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: parsed.data.circleId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Create post
  const post = await prisma.communityPost.create({
    data: {
      circleId: parsed.data.circleId,
      authorId: session.user.id,
      type: "MEETUP",
      content: sanitizeText(parsed.data.content),
      mediaUrls: [],
    },
  });

  // Create meetup
  const meetup = await prisma.meetup.create({
    data: {
      circleId: parsed.data.circleId,
      postId: post.id,
      organizerId: session.user.id,
      title: sanitizeText(parsed.data.title),
      location: sanitizeText(parsed.data.location),
      meetupDate: new Date(parsed.data.meetupDate),
    },
    include: {
      post: true,
      circle: true,
    },
  });

  return NextResponse.json({ meetup }, { status: 201 });
}

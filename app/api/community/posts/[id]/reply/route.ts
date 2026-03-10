import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

const WINDOW_MS = 60_000;
const LIMIT = 40;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`reply:create:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const content = body.content?.trim();

  if (!content || content.length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json(
      { error: "Content too long (max 2000 characters)" },
      { status: 400 }
    );
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: params.id },
    include: {
      circle: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if user is a member of the circle
  const membership = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId: post.circleId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Create reply
  const reply = await prisma.postReply.create({
    data: {
      postId: params.id,
      authorId: session.user.id,
      content: sanitizeText(content),
    },
  });

  // Update reply count
  await prisma.communityPost.update({
    where: { id: params.id },
    data: {
      replyCount: {
        increment: 1,
      },
    },
  });

  // Fetch reply with author info
  const replyWithAuthor = await prisma.postReply.findUnique({
    where: { id: reply.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({ reply: replyWithAuthor }, { status: 201 });
}

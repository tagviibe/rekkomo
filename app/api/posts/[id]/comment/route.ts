import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validators";
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
  const limit = rateLimit(`comment:create:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.communityId) {
    const community = await prisma.community.findUnique({
      where: { id: post.communityId },
    });
    if (community?.visibility === "PRIVATE") {
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
  }

  const parent = parsed.data.parentId
    ? await prisma.comment.findUnique({
        where: { id: parsed.data.parentId },
      })
    : null;

  if (parent && parent.postId !== params.id) {
    return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
  }

  if (parent && parent.depth >= 2) {
    return NextResponse.json(
      { error: "Max nesting depth reached" },
      { status: 400 }
    );
  }

  const depth = parent ? Math.min(parent.depth + 1, 2) : 0;

  const comment = await prisma.comment.create({
    data: {
      postId: params.id,
      authorId: session.user.id,
      body: sanitizeText(parsed.data.body),
      parentId: parsed.data.parentId,
      depth,
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

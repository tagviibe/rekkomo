import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPostSchema } from "@/lib/validators";
import { getAuthSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

const WINDOW_MS = 60_000;
const LIMIT = 30;

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`post:create:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.communityId) {
    const community = await prisma.community.findUnique({
      where: { id: parsed.data.communityId },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    if (community.visibility === "PRIVATE") {
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

  const imageUrl = parsed.data.imageUrl;
  if (imageUrl && !(imageUrl.startsWith("/uploads/") || imageUrl.startsWith("http"))) {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      ...parsed.data,
      title: sanitizeText(parsed.data.title),
      body: sanitizeText(parsed.data.body),
      locationContext: parsed.data.locationContext
        ? sanitizeText(parsed.data.locationContext)
        : undefined,
      imageUrl,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}

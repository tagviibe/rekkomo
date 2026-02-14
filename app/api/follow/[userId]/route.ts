import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 60_000;
const LIMIT = 40;

export async function POST(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow self" }, { status: 400 });
  }

  const ip = _req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`follow:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { profile: true },
  });
  if (!target?.profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!target.profile.allowFollow) {
    return NextResponse.json({ error: "Follow disabled" }, { status: 403 });
  }

  await prisma.follow.upsert({
    where: {
      followerUserId_followingUserId: {
        followerUserId: session.user.id,
        followingUserId: params.userId,
      },
    },
    update: {},
    create: {
      followerUserId: session.user.id,
      followingUserId: params.userId,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot unfollow self" }, { status: 400 });
  }

  await prisma.follow.deleteMany({
    where: {
      followerUserId: session.user.id,
      followingUserId: params.userId,
    },
  });

  return NextResponse.json({ ok: true });
}

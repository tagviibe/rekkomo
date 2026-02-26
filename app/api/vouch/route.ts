import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { updateTrustScore } from "@/lib/trust-score";
import { z } from "zod";

const WINDOW_MS = 60_000;
const LIMIT = 10;

const vouchSchema = z.object({
  voucheeId: z.string(),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`vouch:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = vouchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { voucheeId, note } = parsed.data;

  // Cannot vouch for yourself
  if (voucheeId === session.user.id) {
    return NextResponse.json({ error: "Cannot vouch for yourself" }, { status: 400 });
  }

  // Check if vouchee exists
  const vouchee = await prisma.user.findUnique({
    where: { id: voucheeId },
    include: { profile: true },
  });

  if (!vouchee || !vouchee.profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already vouched (max 1 vouch per user)
  const existingVouch = await prisma.trustVouch.findFirst({
    where: {
      voucherId: session.user.id,
      voucheeId,
    },
  });

  if (existingVouch) {
    return NextResponse.json({ error: "Already vouched for this user" }, { status: 409 });
  }

  // Check how many vouches the vouchee already has (max 3 as per PRD)
  const existingVouches = await prisma.trustVouch.count({
    where: { voucheeId },
  });

  if (existingVouches >= 3) {
    return NextResponse.json({ error: "User already has maximum vouches" }, { status: 400 });
  }

  // Create vouch
  await prisma.trustVouch.create({
    data: {
      voucherId: session.user.id,
      voucheeId,
      note: note || undefined,
    },
  });

  // Update trust score for vouchee
  await updateTrustScore(voucheeId);

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;

  const vouches = await prisma.trustVouch.findMany({
    where: { voucheeId: userId },
    include: {
      voucher: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vouches });
}

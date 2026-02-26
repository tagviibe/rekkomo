import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const WINDOW_MS = 60_000;
const LIMIT = 10;

const applySchema = z.object({
  message: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`job:apply:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "OPEN") {
    return NextResponse.json({ error: "Job is not open for applications" }, { status: 400 });
  }

  // Check if already applied
  const existing = await prisma.application.findFirst({
    where: {
      jobId: params.id,
      seekerId: session.user.id,
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already applied" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      jobId: params.id,
      seekerId: session.user.id,
      status: "APPLIED",
      message: parsed.data.message ? sanitizeText(parsed.data.message) : undefined,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}

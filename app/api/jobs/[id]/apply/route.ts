import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const applySchema = z.object({
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  message: z.string().max(1000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = applySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "OPEN") {
    return NextResponse.json(
      { error: "This job is no longer accepting applications" },
      { status: 400 }
    );
  }

  // Check if already applied
  const existing = await prisma.application.findUnique({
    where: {
      jobId_seekerId: {
        jobId: params.id,
        seekerId: session.user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already applied for this job" },
      { status: 400 }
    );
  }

  // Create application
  await prisma.application.create({
    data: {
      jobId: params.id,
      seekerId: session.user.id,
      status: "APPLIED",
      message: parsed.data.message ? sanitizeText(parsed.data.message) : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

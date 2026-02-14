import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      ...parsed.data,
      reason: sanitizeText(parsed.data.reason),
      reporterId: session.user.id,
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}

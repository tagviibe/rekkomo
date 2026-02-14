import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

const WINDOW_MS = 60_000;
const LIMIT = 5;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`register:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password,
      name: sanitizeText(parsed.data.name),
      profile: { create: {} },
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}

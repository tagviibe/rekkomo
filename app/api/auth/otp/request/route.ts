import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { isValidPhone, normalizePhone } from "@/lib/phone";

const WINDOW_MS = 60_000;
const LIMIT = 5;
const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`otp:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const phoneInput = typeof body?.phone === "string" ? body.phone : "";
  
  // Normalize phone number
  let phone = normalizePhone(phoneInput);
  
  // If phone starts with +91, remove it for normalization
  if (phoneInput.startsWith("+91")) {
    phone = phoneInput.replace("+91", "").replace(/\D/g, "");
  }
  
  // Validate normalized phone
  if (!isValidPhone(phone)) {
    return NextResponse.json({ 
      error: "Invalid phone number. Please enter a valid 10-digit Indian mobile number." 
    }, { status: 400 });
  }

  // Store with country code format for consistency
  const phoneWithCode = `+91${phone}`;
  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.phoneOtp.upsert({
    where: { phone: phoneWithCode },
    create: { phone: phoneWithCode, codeHash, expiresAt },
    update: { codeHash, expiresAt, createdAt: new Date() },
  });

  if (process.env.OTP_DEBUG === "true" || process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, otp });
  }

  // TODO: integrate SMS provider to deliver OTP in production.
  console.info(`[OTP DEBUG] Phone: ${phone} OTP: ${otp}`);

  return NextResponse.json({ ok: true });
}

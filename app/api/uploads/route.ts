import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const LIMIT = 20;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`upload:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File missing" }, { status: 400 });
  }
  const kindRaw = formData.get("kind");
  const kind =
    typeof kindRaw === "string"
      ? kindRaw.toLowerCase()
      : "misc";
  const allowedKinds = new Set(["profile", "post", "community", "misc"]);
  const safeKind = allowedKinds.has(kind) ? kind : "misc";

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    session.user.id,
    safeKind
  );
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return NextResponse.json(
    { url: `/uploads/${session.user.id}/${safeKind}/${fileName}` },
    { status: 201 }
  );
}

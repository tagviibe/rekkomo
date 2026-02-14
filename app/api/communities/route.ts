import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { communityQuerySchema, createCommunitySchema } from "@/lib/validators";
import { getAuthSession } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 60_000;
const LIMIT = 20;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = communityQuerySchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    origin: searchParams.get("origin") ?? undefined,
    destination: searchParams.get("destination") ?? undefined,
    page: searchParams.get("page") ?? "1",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const session = await getAuthSession();
  const { query, origin, destination, page } = parsed.data;
  const limit = 20;
  const skip = (page - 1) * limit;

  const visibilityFilter = session?.user?.id
    ? {
        OR: [
          { visibility: "PUBLIC" },
          { members: { some: { userId: session.user.id } } },
        ],
      }
    : { visibility: "PUBLIC" };

  const communities = await prisma.community.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        origin
          ? {
              OR: [
                { originCountry: { contains: origin, mode: "insensitive" } },
                { originState: { contains: origin, mode: "insensitive" } },
                { originCity: { contains: origin, mode: "insensitive" } },
              ],
            }
          : {},
        destination
          ? {
              OR: [
                {
                  destinationCountry: { contains: destination, mode: "insensitive" },
                },
                { destinationState: { contains: destination, mode: "insensitive" } },
                { destinationCity: { contains: destination, mode: "insensitive" } },
              ],
            }
          : {},
        visibilityFilter,
      ],
    },
    orderBy: { memberCount: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json({ items: communities, page, limit });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`community:create:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = createCommunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const community = await prisma.community.create({
    data: {
      ...parsed.data,
      name: sanitizeText(parsed.data.name),
      description: parsed.data.description
        ? sanitizeText(parsed.data.description)
        : undefined,
      rules: parsed.data.rules ? sanitizeText(parsed.data.rules) : undefined,
    },
  });

  return NextResponse.json({ community }, { status: 201 });
}

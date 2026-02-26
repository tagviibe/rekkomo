import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { z } from "zod";

const WINDOW_MS = 60_000;
const LIMIT = 20;

const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  skillCategory: z.string().min(2),
  payMin: z.number().int().positive().optional(),
  payMax: z.number().int().positive().optional(),
  location: z.string().min(2),
  languagePref: z.array(z.string()).default([]),
  statePref: z.string().optional(),
  numberOfOpenings: z.number().int().positive().default(1),
  deadline: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const limit = rateLimit(`job:create:${ip}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Check trust score (minimum 40 as per PRD)
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { trustScore: true },
    });

    if (!profile || profile.trustScore < 40) {
      return NextResponse.json(
        { error: "Minimum trust score of 40 required to post jobs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Invalid body", 
        details: parsed.error.errors 
      }, { status: 400 });
    }

    const data = parsed.data;
    const deadline = data.deadline ? new Date(data.deadline) : undefined;

    const job = await prisma.jobPost.create({
      data: {
        employerId: session.user.id,
        title: sanitizeText(data.title),
        skillCategory: sanitizeText(data.skillCategory),
        payMin: data.payMin,
        payMax: data.payMax,
        location: sanitizeText(data.location),
        languagePref: data.languagePref.map(sanitizeText),
        statePref: data.statePref ? sanitizeText(data.statePref) : undefined,
        numberOfOpenings: data.numberOfOpenings,
        deadline,
        description: data.description ? sanitizeText(data.description) : undefined,
        status: "OPEN",
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create job",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;
  const statePref = searchParams.get("statePref");
  const skillCategory = searchParams.get("skillCategory");
  const status = searchParams.get("status") || "OPEN";

  const where: any = {
    status: status as any,
  };

  if (statePref) {
    where.statePref = statePref;
  }

  if (skillCategory) {
    where.skillCategory = { contains: skillCategory, mode: "insensitive" };
  }

  const [jobs, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            profile: {
              select: {
                nativePlaceState: true,
                trustScore: true,
              },
            },
          },
        },
        applications: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.jobPost.count({ where }),
  ]);

  return NextResponse.json({ jobs, total, page, limit });
}

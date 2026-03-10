import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { updateTrustScore } from "@/lib/trust-score";
import { CommunityPostType } from "@prisma/client";
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

    // Check trust score (minimum 36 as per PRD)
    let profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { trustScore: true },
    });

    // If profile doesn't exist, return error
    if (!profile) {
      return NextResponse.json(
        { 
          error: "Profile not found. Please complete your onboarding first.",
          code: "PROFILE_NOT_FOUND"
        },
        { status: 403 }
      );
    }

    // Recalculate trust score if it's 0 or seems stale (might not have been calculated)
    let trustScore = profile.trustScore;
    if (trustScore === 0 || trustScore === null) {
      console.log(`Recalculating trust score for user ${session.user.id} (current: ${trustScore})`);
      trustScore = await updateTrustScore(session.user.id);
    }

    if (trustScore < 36) {
      return NextResponse.json(
        { 
          error: "Minimum trust score of 36 required to post jobs",
          code: "TRUST_SCORE_TOO_LOW",
          currentScore: trustScore,
          requiredScore: 36,
          pointsNeeded: 36 - trustScore
        },
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

    // Get user's profile to find their circle
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { nativePlaceState: true, currentCity: true },
    });

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

    // Create a CommunityPost with type JOB_SHARE so it shows in the feed
    if (userProfile?.nativePlaceState && userProfile?.currentCity) {
      try {
        const { getOrCreateStateCircle } = await import("@/lib/circle-utils");
        const circleId = await getOrCreateStateCircle(
          userProfile.nativePlaceState,
          userProfile.currentCity
        );

        // Verify user is a member of the circle
        let membership = await prisma.circleMembership.findUnique({
          where: {
            circleId_userId: {
              circleId,
              userId: session.user.id,
            },
          },
        });

        if (!membership) {
          // Auto-join user to circle
          await prisma.circleMembership.create({
            data: {
              circleId,
              userId: session.user.id,
              joinedAt: new Date(),
            },
          });
          await prisma.circle.update({
            where: { id: circleId },
            data: { memberCount: { increment: 1 } },
          });
        }

        // Create post content from job details
        const postContent = [
          data.title,
          data.description || "",
          `Location: ${data.location}`,
          data.payMin && data.payMax
            ? `Pay: ₹${data.payMin.toLocaleString()} - ₹${data.payMax.toLocaleString()}`
            : data.payMin
            ? `Pay: ₹${data.payMin.toLocaleString()}+`
            : "",
          data.skillCategory ? `Category: ${data.skillCategory}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        const post = await prisma.communityPost.create({
          data: {
            circleId,
            authorId: session.user.id,
            type: CommunityPostType.JOB_SHARE,
            content: sanitizeText(postContent),
            jobPostId: job.id,
          },
        });
      } catch (feedError) {
        // Log error but don't fail the job creation
        console.error("Failed to create feed post for job:", feedError);
      }
    }

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

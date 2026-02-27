import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTrustScore } from "@/lib/trust-score";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = user.profile;
    const userCreatedAt = user.createdAt;

    // Calculate breakdown
    const breakdown = [];

    // Phone Verified
    const phoneVerified = profile.phone ? 20 : 0;
    breakdown.push({
      label: "Phone Verified",
      points: phoneVerified,
      maxPoints: 20,
      completed: phoneVerified >= 20,
      action: phoneVerified < 20 ? "Verify your phone number" : undefined,
      actionLink: phoneVerified < 20 ? "/profile/me/edit" : undefined,
    });

    // Profile Completion
    let completionPoints = 0;
    if (profile.bio) completionPoints += 2;
    if (profile.nativePlaceState) completionPoints += 2;
    if (profile.nativePlaceCity) completionPoints += 2;
    if (profile.currentCity) completionPoints += 2;
    if (profile.profession) completionPoints += 2;
    if (profile.languagesSpoken.length > 0) completionPoints += 2;
    if (profile.interests.length > 0) completionPoints += 2;
    if (profile.dateOfBirth) completionPoints += 2;
    if (profile.gender) completionPoints += 2;
    const profileComplete = Math.min(completionPoints, 20);
    breakdown.push({
      label: "Complete Your Profile",
      points: profileComplete,
      maxPoints: 20,
      completed: profileComplete >= 20,
      action: profileComplete < 20 ? "Add bio, location, profession" : undefined,
      actionLink: profileComplete < 20 ? "/profile/me/edit" : undefined,
    });

    // Aadhaar Linked
    const aadhaarVerified = profile.aadhaarVerified ? 20 : 0;
    breakdown.push({
      label: "Link Aadhaar",
      points: aadhaarVerified,
      maxPoints: 20,
      completed: aadhaarVerified >= 20,
      action: aadhaarVerified < 20 ? "Verify with Aadhaar" : undefined,
      actionLink: aadhaarVerified < 20 ? "/profile/me/edit" : undefined,
    });

    // Community Vouches
    const vouches = await prisma.trustVouch.count({
      where: { voucheeId: profile.userId },
    });
    const vouchesPoints = Math.min(vouches * 10, 30);
    breakdown.push({
      label: "Get Community Vouches",
      points: vouchesPoints,
      maxPoints: 30,
      completed: vouchesPoints >= 30,
      action: vouchesPoints < 30 ? "Ask community members to vouch for you" : undefined,
      actionLink: vouchesPoints < 30 ? "/profile/me" : undefined,
    });

    // Positive Reviews
    const reviews = await prisma.serviceReview.findMany({
      where: { providerId: profile.userId },
      select: { rating: true },
    });
    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    const reviewsPoints = Math.min(positiveReviews * 5, 50);
    breakdown.push({
      label: "Get Positive Reviews",
      points: reviewsPoints,
      maxPoints: 50,
      completed: reviewsPoints >= 50,
      action: reviewsPoints < 50 ? "Complete jobs/services to get reviews" : undefined,
      actionLink: reviewsPoints < 50 ? "/jobs" : undefined,
    });

    // Job/Service Completions
    const completedJobs = await prisma.application.count({
      where: {
        seekerId: profile.userId,
        status: "HIRED",
      },
    });
    const completedServices = await prisma.serviceBooking.count({
      where: {
        providerId: profile.userId,
        status: "COMPLETED",
      },
    });
    const totalCompletions = completedJobs + completedServices;
    const completionsPoints = Math.min(totalCompletions * 3, 30);
    breakdown.push({
      label: "Complete Jobs/Services",
      points: completionsPoints,
      maxPoints: 30,
      completed: completionsPoints >= 30,
      action: completionsPoints < 30 ? "Apply and complete jobs" : undefined,
      actionLink: completionsPoints < 30 ? "/jobs" : undefined,
    });

    // Account Age
    const accountAgeMonths = Math.floor(
      (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const accountAgePoints = Math.min(accountAgeMonths, 12);
    breakdown.push({
      label: "Account Age",
      points: accountAgePoints,
      maxPoints: 12,
      completed: accountAgePoints >= 12,
      action: accountAgePoints < 12 ? "Stay active on the platform" : undefined,
      actionLink: accountAgePoints < 12 ? "/community" : undefined,
    });

    // Calculate total score
    const totalScore = await calculateTrustScore(profile, userCreatedAt);

    return NextResponse.json({
      score: totalScore,
      breakdown,
    });
  } catch (error: any) {
    console.error("Error fetching trust score breakdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch trust score breakdown" },
      { status: 500 }
    );
  }
}

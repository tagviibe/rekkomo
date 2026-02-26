import { prisma } from "@/lib/prisma";
import { Profile } from "@prisma/client";

/**
 * Calculate trust score based on PRD requirements:
 * - Profile Completion: Up to 20 points
 * - Phone Verified: 20 points (mandatory base score)
 * - Aadhaar Linked: +20 points (optional)
 * - Community Vouches: +10 points per vouch (max 3 vouches = 30 pts)
 * - Positive Reviews: +5 points per review (max 50)
 * - Job/Service Completions: +3 points per completion (max 30)
 * - Account Age: +1 point per month active (max 12 pts)
 * - Reports Against User: -20 points per valid report
 */
export async function calculateTrustScore(
  profile: Profile,
  userCreatedAt: Date
): Promise<number> {
  let score = 0;

  // Phone Verified: 20 points (mandatory base score)
  if (profile.phone) {
    score += 20;
  }

  // Profile Completion: Up to 20 points
  let completionPoints = 0;
  if (profile.bio) completionPoints += 2;
  // Profile image is on User model, not Profile
  // if (profile.image) completionPoints += 2;
  if (profile.nativePlaceState) completionPoints += 2;
  if (profile.nativePlaceCity) completionPoints += 2;
  if (profile.currentCity) completionPoints += 2;
  if (profile.profession) completionPoints += 2;
  if (profile.languagesSpoken.length > 0) completionPoints += 2;
  if (profile.interests.length > 0) completionPoints += 2;
  if (profile.dateOfBirth) completionPoints += 2;
  if (profile.gender) completionPoints += 2;
  score += Math.min(completionPoints, 20);

  // Aadhaar Linked: +20 points (optional)
  if (profile.aadhaarVerified) {
    score += 20;
  }

  // Community Vouches: +10 points per vouch (max 3 vouches = 30 pts)
  const vouches = await prisma.trustVouch.count({
    where: { voucheeId: profile.userId },
  });
  score += Math.min(vouches * 10, 30);

  // Positive Reviews: +5 points per review (max 50)
  const reviews = await prisma.serviceReview.findMany({
    where: { providerId: profile.userId },
    select: { rating: true },
  });
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  score += Math.min(positiveReviews * 5, 50);

  // Job/Service Completions: +3 points per completion (max 30)
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
  score += Math.min(totalCompletions * 3, 30);

  // Account Age: +1 point per month active (max 12 pts)
  const accountAgeMonths = Math.floor(
    (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  score += Math.min(accountAgeMonths, 12);

  // Reports Against User: -20 points per valid report
  const validReports = await prisma.report.count({
    where: {
      reportedUserId: profile.userId,
      // Assuming reports are considered "valid" if they exist
      // In production, you'd check a status field
    },
  });
  score -= validReports * 20;

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

/**
 * Update trust score for a user profile
 */
export async function updateTrustScore(userId: string): Promise<number> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!profile || !profile.user) {
    return 0;
  }

  const score = await calculateTrustScore(profile, profile.user.createdAt);

  await prisma.profile.update({
    where: { userId },
    data: { trustScore: score },
  });

  return score;
}

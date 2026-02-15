import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewProfile, overlapCount } from "@/lib/people";

const LIMIT_DEFAULT = 20;

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Number(searchParams.get("limit") ?? LIMIT_DEFAULT),
    50
  );

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      memberships: { select: { communityId: true } },
      following: { select: { followingUserId: true } },
    },
  });

  if (!currentUser?.profile) {
    return NextResponse.json({ items: [] });
  }

  const currentProfile = currentUser.profile;
  const alreadyFollowing = new Set(
    currentUser.following.map((f) => f.followingUserId)
  );
  const currentCommunityIds = new Set(
    currentUser.memberships.map((m) => m.communityId)
  );

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      profile: { allowFollow: true },
    },
    include: {
      profile: true,
      memberships: { select: { communityId: true } },
    },
    take: 200,
  });

  const scored = candidates
    .filter((candidate) => !alreadyFollowing.has(candidate.id))
    .map((candidate) => {
      const profile = candidate.profile;
      if (!profile) return null;
      const hasCommunityOverlap = candidate.memberships.some((m) =>
        currentCommunityIds.has(m.communityId)
      );

      if (
        !canViewProfile(profile.profileVisibility, {
          isSelf: false,
          hasCommunityOverlap,
        })
      ) {
        return null;
      }

      let score = 0;
      const reasons: string[] = [];

      if (
        currentProfile.currentCity &&
        profile.currentCity &&
        currentProfile.currentCity.toLowerCase() === profile.currentCity.toLowerCase()
      ) {
        score += 50;
        reasons.push("Same city");
      }

      if (
        (currentProfile.nativePlaceCity || currentProfile.nativePlace) &&
        (profile.nativePlaceCity || profile.nativePlace) &&
        currentProfile.showNativePlace &&
        profile.showNativePlace &&
        (currentProfile.nativePlaceCity || currentProfile.nativePlace)?.toLowerCase() ===
          (profile.nativePlaceCity || profile.nativePlace)?.toLowerCase()
      ) {
        score += 30;
        reasons.push("Same native place");
      }

      const communityOverlap = overlapCount(
        currentUser.memberships.map((m) => m.communityId),
        candidate.memberships.map((m) => m.communityId)
      );
      if (communityOverlap > 0) {
        score += Math.min(communityOverlap * 20, 40);
        reasons.push("Same community");
      }

      const interestOverlap = overlapCount(
        currentProfile.interests,
        profile.interests
      );
      if (interestOverlap > 0) {
        score += Math.min(interestOverlap * 10, 30);
        reasons.push("Common interests");
      }

      const recentBonus =
        candidate.updatedAt &&
        Date.now() - candidate.updatedAt.getTime() < 1000 * 60 * 60 * 24 * 14
          ? 5
          : 0;
      if (recentBonus) {
        score += recentBonus;
        reasons.push("Recently active");
      }

      return {
        user: {
          id: candidate.id,
          name: candidate.name,
          avatarUrl: candidate.image,
          currentCity: profile.currentCity,
          nativePlace: profile.showNativePlace
            ? profile.nativePlaceCity || profile.nativePlace
            : null,
          communities: profile.communities,
        },
        score,
        reasons,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
    .slice(0, limit);

  return NextResponse.json({ items: scored });
}

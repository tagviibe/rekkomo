import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewProfile } from "@/lib/people";

export async function GET(req: Request) {
  const session = await getAuthSession();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const community = searchParams.get("community")?.trim() ?? "";

  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { memberships: { select: { communityId: true } } },
      })
    : null;

  const candidates = await prisma.user.findMany({
    where: {
      profile: {
        isNot: null,
        is: {
          allowFollow: true,
          ...(city
            ? { currentCity: { contains: city, mode: "insensitive" } }
            : {}),
        },
      },
      OR: query
        ? [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      profile: true,
      memberships: { select: { communityId: true } },
    },
    take: 50,
  });

  const currentCommunityIds = new Set(
    currentUser?.memberships.map((m) => m.communityId) ?? []
  );

  const items = candidates
    .filter((candidate) => {
      const profile = candidate.profile;
      if (!profile) return false;
      const hasCommunityOverlap = candidate.memberships.some((m) =>
        currentCommunityIds.has(m.communityId)
      );
      return canViewProfile(profile.profileVisibility, {
        isSelf: session?.user?.id === candidate.id,
        hasCommunityOverlap,
      });
    })
    .filter((candidate) => {
      if (!community) return true;
      return candidate.profile?.communities.some((c) =>
        c.toLowerCase().includes(community.toLowerCase())
      );
    })
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      avatarUrl: candidate.image,
      currentCity: candidate.profile?.currentCity,
      nativePlace: candidate.profile?.showNativePlace
        ? candidate.profile?.nativePlaceCity || candidate.profile?.nativePlace
        : null,
      communities: candidate.profile?.communities ?? [],
    }));

  return NextResponse.json({ items });
}

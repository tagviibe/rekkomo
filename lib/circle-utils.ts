import { prisma } from "@/lib/prisma";
import { CircleLevel } from "@prisma/client";

/**
 * Auto-create or get STATE circle for a state+city combination
 */
export async function getOrCreateStateCircle(
  state: string,
  city: string
): Promise<string> {
  let circle = await prisma.circle.findFirst({
    where: {
      level: CircleLevel.STATE,
      state,
      city,
    },
  });

  if (!circle) {
    circle = await prisma.circle.create({
      data: {
        name: `${state} Circle — ${city}`,
        level: CircleLevel.STATE,
        state,
        city,
        isAutoFormed: true,
        isActive: true,
      },
    });
  }

  return circle.id;
}

/**
 * Auto-create or get DISTRICT circle (requires 10+ members)
 */
export async function getOrCreateDistrictCircle(
  state: string,
  district: string,
  city: string
): Promise<string | null> {
  let circle = await prisma.circle.findFirst({
    where: {
      level: CircleLevel.DISTRICT,
      state,
      district,
      city,
    },
  });

  if (!circle) {
    // Check if we have 10+ members from this district in this city
    const userCount = await prisma.profile.count({
      where: {
        nativePlaceState: state,
        nativePlaceCity: district,
        currentCity: city,
      },
    });

    if (userCount >= 10) {
      circle = await prisma.circle.create({
        data: {
          name: `${district} District Circle — ${city}`,
          level: CircleLevel.DISTRICT,
          state,
          district,
          city,
          isAutoFormed: true,
          isActive: true,
        },
      });
    } else {
      return null; // Not enough members yet
    }
  }

  return circle.id;
}

/**
 * Auto-join user to their STATE circle after onboarding
 */
export async function autoJoinStateCircle(
  userId: string,
  nativeState: string | null | undefined,
  currentCity: string | null | undefined
): Promise<string | null> {
  if (!nativeState || !currentCity) {
    return null;
  }

  const circleId = await getOrCreateStateCircle(nativeState, currentCity);

  // Check if already a member
  const existing = await prisma.circleMembership.findUnique({
    where: {
      circleId_userId: {
        circleId,
        userId,
      },
    },
  });

  if (!existing) {
    // Create membership
    const membership = await prisma.circleMembership.create({
      data: {
        circleId,
        userId,
      },
    });

    // Update member count
    await prisma.circle.update({
      where: { id: circleId },
      data: { memberCount: { increment: 1 } },
    });

    // Check if this is one of the first 3 members (Welcome Committee)
    const memberCount = await prisma.circleMembership.count({
      where: { circleId },
    });

    if (memberCount <= 3) {
      await prisma.circleMembership.update({
        where: { id: membership.id },
        data: { isWelcomeCommittee: true },
      });
    }
  }

  return circleId;
}

import { prisma } from "@/lib/prisma";
import { CommunityType } from "@prisma/client";

/**
 * Auto-join or create State Circle based on native state + current city
 * As per PRD: "On sign-up, user is automatically added to their State Circle in their current city"
 */
export async function autoJoinStateCircle(
  userId: string,
  nativeState: string | null | undefined,
  currentCity: string | null | undefined
): Promise<string | null> {
  if (!nativeState || !currentCity) {
    return null;
  }

  // Normalize state and city names for slug generation
  const stateSlug = nativeState.toLowerCase().replace(/\s+/g, "-");
  const citySlug = currentCity.toLowerCase().replace(/\s+/g, "-");
  const communitySlug = `${stateSlug}-circle-${citySlug}`;
  const communityName = `${nativeState} Circle — ${currentCity}`;

  // Find or create the State Circle
  let community = await prisma.community.findUnique({
    where: { slug: communitySlug },
  });

  if (!community) {
    // Create the State Circle if it doesn't exist
    community = await prisma.community.create({
      data: {
        name: communityName,
        slug: communitySlug,
        type: CommunityType.STATE_CIRCLE,
        originState: nativeState,
        destinationCity: currentCity,
        originCountry: "India",
        destinationCountry: "India",
        visibility: "PUBLIC",
        description: `Community circle for people from ${nativeState} living in ${currentCity}`,
      },
    });
  }

  // Check if user is already a member
  const existingMember = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId: community.id,
      },
    },
  });

  if (!existingMember) {
    // Auto-join the community
    await prisma.communityMember.create({
      data: {
        userId,
        communityId: community.id,
        status: "APPROVED",
      },
    });

    // Update member count
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount: { increment: 1 } },
    });
  }

  return community.id;
}

/**
 * Get or create District Circle (requires 10+ members to form)
 */
export async function getOrCreateDistrictCircle(
  userId: string,
  nativeState: string | null | undefined,
  nativeDistrict: string | null | undefined,
  currentCity: string | null | undefined
): Promise<string | null> {
  if (!nativeState || !nativeDistrict || !currentCity) {
    return null;
  }

  const stateSlug = nativeState.toLowerCase().replace(/\s+/g, "-");
  const districtSlug = nativeDistrict.toLowerCase().replace(/\s+/g, "-");
  const citySlug = currentCity.toLowerCase().replace(/\s+/g, "-");
  const communitySlug = `${districtSlug}-district-${stateSlug}-${citySlug}`;
  const communityName = `${nativeDistrict} District Circle — ${currentCity}`;

  let community = await prisma.community.findUnique({
    where: { slug: communitySlug },
    include: {
      members: {
        where: { status: "APPROVED" },
      },
    },
  });

  if (!community) {
    // Create district circle
    community = await prisma.community.create({
      data: {
        name: communityName,
        slug: communitySlug,
        type: CommunityType.DISTRICT_CIRCLE,
        originState: nativeState,
        originCity: nativeDistrict,
        destinationCity: currentCity,
        originCountry: "India",
        destinationCountry: "India",
        visibility: "PUBLIC",
        description: `District circle for people from ${nativeDistrict}, ${nativeState} living in ${currentCity}`,
      },
      include: {
        members: {
          where: { status: "APPROVED" },
        },
      },
    });
  }

  // Only allow joining if there are 10+ members (as per PRD)
  if (community.members.length >= 10) {
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    if (!existingMember) {
      await prisma.communityMember.create({
        data: {
          userId,
          communityId: community.id,
          status: "APPROVED",
        },
      });

      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return community.id;
  }

  return null;
}

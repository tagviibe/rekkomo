import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommunityType } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      memberships: {
        include: {
          community: true,
        },
      },
    },
  });

  if (!user?.profile) {
    return NextResponse.json({ circle: null });
  }

  // Find the user's primary state circle
  const stateCircle = user.memberships
    .map((m) => m.community)
    .find(
      (c) =>
        c.type === CommunityType.STATE_CIRCLE &&
        user.profile &&
        c.originState === user.profile.nativePlaceState &&
        c.destinationCity === user.profile.currentCity
    );

  if (!stateCircle) {
    return NextResponse.json({ circle: null });
  }

  // Get member count
  const memberCount = await prisma.communityMember.count({
    where: {
      communityId: stateCircle.id,
      status: "APPROVED",
    },
  });

  return NextResponse.json({
    circle: {
      id: stateCircle.id,
      name: stateCircle.name,
      slug: stateCircle.slug,
      memberCount,
      originState: stateCircle.originState,
      destinationCity: stateCircle.destinationCity,
    },
  });
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import EventDetailClient from "./EventDetailClient";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();
  
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              nativePlaceState: true,
              trustScore: true,
              profession: true,
              currentCity: true,
            },
          },
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
        },
      },
      rsvps: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: {
                select: {
                  nativePlaceState: true,
                  profession: true,
                  currentCity: true,
                  trustScore: true,
                },
              },
            },
          },
        },
        take: 10,
      },
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const userRSVP = session?.user?.id
    ? event.rsvps.find((r) => r.userId === session.user.id)
    : null;

  // Get similar events
  const similarEvents = await prisma.event.findMany({
    where: {
      id: { not: event.id },
      startsAt: { gte: new Date() },
      OR: [
        { location: { contains: event.location?.split(",")[0] || "" } },
        { communityId: event.communityId },
      ],
    },
    include: {
      creator: {
        select: {
          name: true,
        },
      },
      community: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
    take: 3,
    orderBy: {
      startsAt: "asc",
    },
  });

  return (
    <EventDetailClient
      event={event}
      userRSVP={userRSVP}
      isAuthenticated={!!session}
      similarEvents={similarEvents}
    />
  );
}

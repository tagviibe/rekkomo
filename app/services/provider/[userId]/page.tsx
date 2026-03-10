import { Suspense } from "react";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ProviderProfileClient from "./ProviderProfileClient";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await getAuthSession();

  // Fetch provider data
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: params.userId },
    include: {
      user: {
        include: {
          profile: {
            select: {
              currentCity: true,
              nativePlaceState: true,
              profession: true,
              bio: true,
            },
          },
        },
      },
      reviews: {
        include: {
          reviewer: {
            include: {
              profile: {
                select: {
                  nativePlaceState: true,
                  trustScore: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-600">Service provider not found</p>
        </div>
      </div>
    );
  }

  // Calculate average rating
  const ratings = provider.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <ProviderProfileClient
          provider={{
            ...provider,
            ratingAvg: avgRating,
            services: provider.services as any,
          }}
          currentUserId={session?.user?.id || null}
        />
      </Suspense>
    </div>
  );
}

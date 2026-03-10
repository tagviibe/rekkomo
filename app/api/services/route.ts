import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const city = searchParams.get("city");

    const where: any = {};

    if (category && category !== "all") {
      where.category = category as ServiceCategory;
    }

    // Fetch providers with user and profile data
    const providers = await prisma.serviceProvider.findMany({
      where,
      include: {
        user: {
          include: {
            profile: {
              select: {
                currentCity: true,
                nativePlaceState: true,
                profession: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        ratingAvg: "desc",
      },
      take: 50,
    });

    // Filter by search term if provided
    let filteredProviders = providers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProviders = providers.filter((p) => {
        const userName = p.user.name?.toLowerCase() || "";
        const profession = p.user.profile?.profession?.toLowerCase() || "";
        const categoryName = p.category.toLowerCase();
        return (
          userName.includes(searchLower) ||
          profession.includes(searchLower) ||
          categoryName.includes(searchLower)
        );
      });
    }

    // Filter by city if provided
    if (city) {
      filteredProviders = filteredProviders.filter((p) => {
        const providerCity = p.user.profile?.currentCity?.toLowerCase() || "";
        return providerCity.includes(city.toLowerCase());
      });
    }

    // Calculate average rating for each provider
    const providersWithRating = filteredProviders.map((provider) => {
      const ratings = provider.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        id: provider.id,
        userId: provider.userId,
        category: provider.category,
        categoryName: (provider as any).categoryName || null,
        languages: provider.languages,
        serviceArea: provider.serviceArea,
        services: (provider as any).services || null, // Include services array if available
        serviceScope: (provider as any).serviceScope || "both", // Include service scope
        rate: provider.rate,
        ratingAvg: avgRating || provider.ratingAvg,
        reviewCount: provider._count.reviews,
        bookingCount: provider._count.bookings,
        acceptsUrgent: (provider as any).acceptsUrgent || false,
        communityDiscount: (provider as any).communityDiscount || false,
        user: {
          id: provider.user.id,
          name: provider.user.name,
          image: provider.user.image,
        },
        profile: provider.user.profile,
      };
    });

    return NextResponse.json({
      providers: providersWithRating,
      total: providersWithRating.length,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

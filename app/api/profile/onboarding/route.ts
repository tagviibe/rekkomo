import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { generateUniqueUsername } from "@/lib/username";
import { updateTrustScore } from "@/lib/trust-score";

const WINDOW_MS = 60_000;
const LIMIT = 20;

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`onboarding:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.phone) {
    const existingPhone = await prisma.profile.findFirst({
      where: {
        phone: data.phone,
        userId: { not: session.user.id },
      },
      select: { id: true },
    });
    if (existingPhone) {
      return NextResponse.json({ error: "Phone already in use" }, { status: 409 });
    }
  }
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true, email: true },
  });

  const safeName =
    data.name?.trim() ||
    existingUser?.name ||
    existingUser?.email?.split("@")[0] ||
    "User";

  const username =
    existingUser?.username ??
    (await generateUniqueUsername(
      safeName,
      async (candidate) => {
        const found = await prisma.user.findUnique({
          where: { username: candidate },
          select: { id: true },
        });
        return Boolean(found);
      }
    ));

  const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined;
  if (dob && Number.isNaN(dob.getTime())) {
    return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
  }

  try {
    // Update user and profile
    await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: sanitizeText(safeName),
      username,
      profile: {
        upsert: {
          create: {
            bio: data.bio ? sanitizeText(data.bio) : undefined,
            phone: data.phone ? sanitizeText(data.phone) : undefined,
            originCountry: data.originCountry ? sanitizeText(data.originCountry) : undefined,
            originState: data.originState ? sanitizeText(data.originState) : undefined,
            originCity: data.originCity ? sanitizeText(data.originCity) : undefined,
            currentCountry: data.currentCountry ? sanitizeText(data.currentCountry) : undefined,
            currentState: data.currentState ? sanitizeText(data.currentState) : undefined,
            currentCity: data.currentCity ? sanitizeText(data.currentCity) : undefined,
            currentLocality: data.currentLocality ? sanitizeText(data.currentLocality) : undefined,
            nativePlace: data.nativePlace
              ? sanitizeText(data.nativePlace)
              : data.nativePlaceCity || data.nativePlaceState
              ? [data.nativePlaceCity, data.nativePlaceState]
                  .filter(Boolean)
                  .join(", ")
              : undefined,
            nativePlaceCity: data.nativePlaceCity ? sanitizeText(data.nativePlaceCity) : undefined,
            nativePlaceState: data.nativePlaceState ? sanitizeText(data.nativePlaceState) : undefined,
            gender: data.gender,
            dateOfBirth: dob,
            interests: data.interests.map(sanitizeText),
            languages: data.languages.map(sanitizeText),
            languagesSpoken: data.languagesSpoken.map(sanitizeText),
            communities: data.communities.map(sanitizeText),
            needs: data.needs.map(sanitizeText),
            canOffer: data.canOffer.map(sanitizeText),
            profession: data.profession,
            movedToCityWhen: data.movedToCityWhen,
            showEmail: data.showEmail,
            showPhone: data.showPhone,
            showApproxLocation: data.showApproxLocation,
            profileVisibility: data.profileVisibility,
            showNativePlace: data.showNativePlace,
            showActivity: data.showActivity,
            allowFollow: data.allowFollow,
            platformRoles: data.platformRoles,
            onboardingCompleted: true,
          },
          update: {
            bio: data.bio ? sanitizeText(data.bio) : undefined,
            phone: data.phone ? sanitizeText(data.phone) : undefined,
            originCountry: data.originCountry ? sanitizeText(data.originCountry) : undefined,
            originState: data.originState ? sanitizeText(data.originState) : undefined,
            originCity: data.originCity ? sanitizeText(data.originCity) : undefined,
            currentCountry: data.currentCountry ? sanitizeText(data.currentCountry) : undefined,
            currentState: data.currentState ? sanitizeText(data.currentState) : undefined,
            currentCity: data.currentCity ? sanitizeText(data.currentCity) : undefined,
            currentLocality: data.currentLocality ? sanitizeText(data.currentLocality) : undefined,
            nativePlace: data.nativePlace
              ? sanitizeText(data.nativePlace)
              : data.nativePlaceCity || data.nativePlaceState
              ? [data.nativePlaceCity, data.nativePlaceState]
                  .filter(Boolean)
                  .join(", ")
              : undefined,
            nativePlaceCity: data.nativePlaceCity ? sanitizeText(data.nativePlaceCity) : undefined,
            nativePlaceState: data.nativePlaceState ? sanitizeText(data.nativePlaceState) : undefined,
            gender: data.gender,
            dateOfBirth: dob,
            interests: data.interests.map(sanitizeText),
            languages: data.languages.map(sanitizeText),
            languagesSpoken: data.languagesSpoken.map(sanitizeText),
            communities: data.communities.map(sanitizeText),
            needs: data.needs.map(sanitizeText),
            canOffer: data.canOffer.map(sanitizeText),
            profession: data.profession,
            movedToCityWhen: data.movedToCityWhen,
            showEmail: data.showEmail,
            showPhone: data.showPhone,
            showApproxLocation: data.showApproxLocation,
            profileVisibility: data.profileVisibility,
            showNativePlace: data.showNativePlace,
            showActivity: data.showActivity,
            allowFollow: data.allowFollow,
            platformRoles: data.platformRoles,
            onboardingCompleted: true,
          },
        },
      },
    },
  });

    // Auto-join State Circle based on native state + current city
    const nativeState = data.nativePlaceState || data.originState;
    const currentCity = data.currentCity;
    if (nativeState && currentCity) {
      try {
        const { autoJoinStateCircle } = await import("@/lib/circle-utils");
        await autoJoinStateCircle(session.user.id, nativeState, currentCity);
      } catch (err) {
        console.error("Error auto-joining state circle:", err);
        // Don't fail onboarding if state circle join fails
      }
    }

    // Update trust score after onboarding
    try {
      await updateTrustScore(session.user.id);
    } catch (err) {
      console.error("Error updating trust score:", err);
      // Don't fail onboarding if trust score update fails
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to save profile. Please ensure database migrations are up to date.",
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

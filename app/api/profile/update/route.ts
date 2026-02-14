import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validators";
import { sanitizeText } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { generateUniqueUsername } from "@/lib/username";

const WINDOW_MS = 60_000;
const LIMIT = 30;

export async function PATCH(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`profile:update:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
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
  const image = data.image;
  if (image && !(image.startsWith("/uploads/") || image.startsWith("http"))) {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, name: true, email: true },
  });
  const username =
    existingUser?.username ??
    (await generateUniqueUsername(
      data.name || existingUser?.name || existingUser?.email || "user",
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

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name ? sanitizeText(data.name) : undefined,
      image,
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
            interests: data.interests?.map(sanitizeText) ?? [],
            languages: data.languages?.map(sanitizeText) ?? [],
            languagesSpoken: data.languagesSpoken?.map(sanitizeText) ?? [],
            communities: data.communities?.map(sanitizeText) ?? [],
            needs: data.needs?.map(sanitizeText) ?? [],
            canOffer: data.canOffer?.map(sanitizeText) ?? [],
            profession: data.profession ?? "OTHER",
            movedToCityWhen: data.movedToCityWhen ?? undefined,
            showEmail: data.showEmail ?? false,
            showPhone: data.showPhone ?? false,
            showApproxLocation: data.showApproxLocation ?? true,
            profileVisibility: data.profileVisibility ?? "PUBLIC",
            showNativePlace: data.showNativePlace ?? true,
            showActivity: data.showActivity ?? true,
            allowFollow: data.allowFollow ?? true,
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
            interests: data.interests ? data.interests.map(sanitizeText) : undefined,
            languages: data.languages ? data.languages.map(sanitizeText) : undefined,
            languagesSpoken: data.languagesSpoken
              ? data.languagesSpoken.map(sanitizeText)
              : undefined,
            communities: data.communities ? data.communities.map(sanitizeText) : undefined,
            needs: data.needs ? data.needs.map(sanitizeText) : undefined,
            canOffer: data.canOffer ? data.canOffer.map(sanitizeText) : undefined,
            profession: data.profession,
            movedToCityWhen: data.movedToCityWhen,
            showEmail: data.showEmail,
            showPhone: data.showPhone,
            showApproxLocation: data.showApproxLocation,
            profileVisibility: data.profileVisibility,
            showNativePlace: data.showNativePlace,
            showActivity: data.showActivity,
            allowFollow: data.allowFollow,
          },
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}

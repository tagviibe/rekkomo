import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import ProfileClient from "./ProfileClient";
import { HiOutlineMapPin, HiOutlineHome, HiOutlineLanguage } from "react-icons/hi2";

export default async function MyProfilePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const profile = user.profile;
  const fullOrigin = [profile?.originCity, profile?.originState, profile?.originCountry]
    .filter(Boolean)
    .join(", ");
  const fullCurrent = [
    profile?.currentLocality,
    profile?.currentCity,
    profile?.currentState,
    profile?.currentCountry,
  ]
    .filter(Boolean)
    .join(", ");
  const nativePlace = [profile?.nativePlaceCity, profile?.nativePlaceState]
    .filter(Boolean)
    .join(", ");

  const followersCount = await prisma.follow.count({
    where: { followingUserId: user.id },
  });
  const followingCount = await prisma.follow.count({
    where: { followerUserId: user.id },
  });

  const displayName = user.name ?? user.username ?? "User";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="relative overflow-hidden rounded-2xl border bg-white">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-400" />
        <div className="relative -mt-12 flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={displayName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-xl font-semibold text-blue-700">
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold">
                {displayName}
              </h1>
              <p className="text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                {fullCurrent || "Add your current location"}
              </p>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span>{followersCount} followers</span>
                <span>{followingCount} following</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border px-4 py-2 text-sm">
              Edit profile
            </button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
              Share profile
            </button>
            <a
              className="rounded-lg border px-4 py-2 text-sm"
              href="/communities/create"
            >
              Create community
            </a>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <ProfileClient
            initial={{
              name: user.name,
              email: user.email,
              image: user.image,
              bio: profile?.bio,
              phone: profile?.phone ?? null,
              nativePlace: profile?.nativePlace,
              originCountry: profile?.originCountry,
              originState: profile?.originState,
              originCity: profile?.originCity,
              currentCountry: profile?.currentCountry,
              currentState: profile?.currentState,
              currentCity: profile?.currentCity,
              currentLocality: profile?.currentLocality,
              gender: profile?.gender ?? null,
              dateOfBirth: profile?.dateOfBirth
                ? profile.dateOfBirth.toISOString().slice(0, 10)
                : null,
              interests: profile?.interests,
              languages: profile?.languages,
              communities: profile?.communities,
              needs: profile?.needs,
              canOffer: profile?.canOffer,
              profession: profile?.profession,
              movedToCityWhen: profile?.movedToCityWhen,
              profileVisibility: profile?.profileVisibility,
              showNativePlace: profile?.showNativePlace,
              showActivity: profile?.showActivity,
              allowFollow: profile?.allowFollow,
              showEmail: profile?.showEmail,
              showPhone: profile?.showPhone,
              showApproxLocation: profile?.showApproxLocation,
            }}
          />
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Intro</h2>
            <p className="mt-2 text-sm text-slate-600">
              {profile?.bio ?? "Write a short bio so others can know you."}
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <HiOutlineHome className="text-slate-500" />
                <span>{fullOrigin || "Add your origin"}</span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineMapPin className="text-slate-500" />
                <span>{fullCurrent || "Add your current location"}</span>
              </div>
              {profile?.showNativePlace && (
                <div className="flex items-center gap-2">
                  <HiOutlineMapPin className="text-slate-500" />
                  <span>{nativePlace || "Add your native place"}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <HiOutlineLanguage className="text-slate-500" />
                <span>
                  {profile?.languages?.length
                    ? profile.languages.join(", ")
                    : "Add languages"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Interests</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile?.interests?.length ? (
                profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border bg-blue-50 px-3 py-1 text-xs text-blue-700"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-600">Add your interests</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Activity</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-600">
                Your posts will show here once you start sharing.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">About</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                Origin: {fullOrigin || "Not set"}
              </p>
              <p>
                Current: {fullCurrent || "Not set"}
              </p>
              <p>Verification: {profile?.verificationLevel ?? "NONE"}</p>
              <p>Joined: {user.createdAt.toDateString()}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Privacy</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Show email: {profile?.showEmail ? "Yes" : "No"}</li>
              <li>Show phone: {profile?.showPhone ? "Yes" : "No"}</li>
              <li>
                Show approximate location:{" "}
                {profile?.showApproxLocation ? "Yes" : "No"}
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Communities</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start a new community for your origin or destination.
            </p>
            <a
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              href="/communities/create"
            >
              Create community
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

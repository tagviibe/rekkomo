import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { canViewProfile } from "@/lib/people";
import FollowButton from "./follow-button";

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      memberships: { select: { communityId: true } },
    },
  });

  if (!user?.profile) return notFound();

  const viewer = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { memberships: { select: { communityId: true } } },
      })
    : null;

  const hasCommunityOverlap = viewer
    ? user.memberships.some((m) =>
        viewer.memberships.some((vm) => vm.communityId === m.communityId)
      )
    : false;

  const canView = canViewProfile(user.profile.profileVisibility, {
    isSelf: session?.user?.id === user.id,
    hasCommunityOverlap,
  });

  if (!canView) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-slate-600">
          This profile is private.
        </p>
      </main>
    );
  }

  const followersCount = await prisma.follow.count({
    where: { followingUserId: user.id },
  });
  const followingCount = await prisma.follow.count({
    where: { followerUserId: user.id },
  });

  const fullCurrent = [
    user.profile.currentLocality,
    user.profile.currentCity,
    user.profile.currentState,
    user.profile.currentCountry,
  ]
    .filter(Boolean)
    .join(", ");
  const nativePlace = [
    user.profile.nativePlaceCity,
    user.profile.nativePlaceState,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Profile"}
              width={64}
              height={64}
              className="rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-sm font-semibold text-blue-700">
              {(user.name ?? user.username ?? "U")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {user.name ?? "Member"}
            </h1>
            <p className="text-sm text-slate-600">{fullCurrent}</p>
            <p className="mt-1 text-xs text-slate-500">
              {followersCount} followers · {followingCount} following
            </p>
          </div>
          <div className="ml-auto">
            <FollowButton userId={user.id} allowFollow={user.profile.allowFollow} />
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {user.profile.bio ?? "No bio yet."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {user.profile.showNativePlace && (nativePlace || user.profile.nativePlace) && (
            <span className="rounded-full border px-3 py-1">
              Native: {nativePlace || user.profile.nativePlace}
            </span>
          )}
          {user.profile.interests.map((interest) => (
            <span key={interest} className="rounded-full border px-3 py-1">
              {interest}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

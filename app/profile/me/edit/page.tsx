import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ProfileClient from "../ProfileClient";

export default async function EditProfilePage() {
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

  const initialData = {
    name: user.name ?? "",
    bio: profile?.bio ?? "",
    phone: profile?.phone ?? "",
    nativePlace: profile?.nativePlace ?? "",
    originCountry: profile?.originCountry ?? "",
    originState: profile?.originState ?? "",
    originCity: profile?.originCity ?? "",
    currentCountry: profile?.currentCountry ?? "",
    currentState: profile?.currentState ?? "",
    currentCity: profile?.currentCity ?? "",
    currentLocality: profile?.currentLocality ?? "",
    gender: profile?.gender ?? "",
    dateOfBirth: profile?.dateOfBirth 
      ? (profile.dateOfBirth instanceof Date 
          ? profile.dateOfBirth.toISOString().split("T")[0] 
          : typeof profile.dateOfBirth === "string" 
          ? (profile.dateOfBirth as string).split("T")[0] 
          : "")
      : "",
    interests: profile?.interests ?? [],
    languages: profile?.languages ?? [],
    communities: profile?.communities ?? [],
    needs: profile?.needs ?? [],
    canOffer: profile?.canOffer ?? [],
    profession: profile?.profession ?? "",
    movedToCityWhen: profile?.movedToCityWhen ?? "",
    profileVisibility: profile?.profileVisibility ?? "PUBLIC",
    showNativePlace: profile?.showNativePlace ?? true,
    showActivity: profile?.showActivity ?? true,
    allowFollow: profile?.allowFollow ?? true,
    showEmail: profile?.showEmail ?? true,
    showPhone: profile?.showPhone ?? true,
    showApproxLocation: profile?.showApproxLocation ?? true,
    image: user.image ?? "",
    nativePlaceCity: profile?.nativePlaceCity ?? "",
    nativePlaceState: profile?.nativePlaceState ?? "",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <ProfileClient initial={initialData} startEditing={true} />
      </main>
    </div>
  );
}

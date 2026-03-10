import { Suspense } from "react";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import InquiryChatClient from "./InquiryChatClient";

export const dynamic = "force-dynamic";

export default async function InquiryPage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-600">Please sign in to send an inquiry</p>
        </div>
      </div>
    );
  }

  // Fetch provider data
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: params.userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              currentCity: true,
            },
          },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <InquiryChatClient
          providerUserId={params.userId}
          provider={provider.user}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

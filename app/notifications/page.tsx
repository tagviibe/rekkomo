import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin?callback=/notifications");
  }

  // Fetch pending friend requests
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: session.user.id,
      status: "PENDING",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          profile: {
            select: {
              nativePlaceState: true,
              currentCity: true,
              profession: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <NotificationsClient
        initialFriendRequests={friendRequests}
        currentUserId={session.user.id}
      />
    </div>
  );
}

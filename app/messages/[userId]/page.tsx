import { Suspense } from "react";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ConversationChatClient from "./ConversationChatClient";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (params.userId === session.user.id) {
    redirect("/messages");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Loading chat...</div>}>
        <ConversationChatClient
          otherUserId={params.userId}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center">Loading messages...</div>}>
        <MessagesClient currentUserId={session.user.id} />
      </Suspense>
    </div>
  );
}

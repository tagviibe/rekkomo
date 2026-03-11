"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ServiceProviderSuccess from "./ServiceProviderSuccess";

function SuccessContent() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId");

  return <ServiceProviderSuccess providerId={providerId || undefined} />;
}

export default function ServiceProviderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

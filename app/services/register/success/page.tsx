"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ServiceProviderSuccess from "./ServiceProviderSuccess";

export default function ServiceProviderSuccessPage() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ServiceProviderSuccess providerId={providerId || undefined} />
    </div>
  );
}

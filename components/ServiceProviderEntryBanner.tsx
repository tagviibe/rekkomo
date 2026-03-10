"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Wrench, ArrowRight, Zap, Stethoscope, GraduationCap, Hammer } from "lucide-react";

const EXAMPLE_SERVICES = [
  { icon: Zap, label: "Electrician" },
  { icon: Wrench, label: "Plumber" },
  { icon: Stethoscope, label: "Doctor" },
  { icon: GraduationCap, label: "Tutor" },
];

export default function ServiceProviderEntryBanner({
  circleName,
  variant = "profile",
}: {
  circleName?: string;
  variant?: "profile" | "browse" | "onboarding";
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isProvider, setIsProvider] = useState(false);

  useEffect(() => {
    checkProviderStatus();
  }, []);

  const checkProviderStatus = async () => {
    try {
      const res = await fetch("/api/services/me");
      if (res.ok) {
        const data = await res.json();
        setIsProvider(!!data.provider);
      }
    } catch (error) {
      // User is not a provider
      setIsProvider(false);
    }
  };

  if (isProvider) return null;

  if (variant === "profile") {
    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl">
        <div className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">
          Start Earning More
        </div>
        <div className="text-base font-bold text-gray-800 mb-1">
          Offer services in {circleName || "your community"}
        </div>
        <div className="text-sm text-yellow-900 mb-3">
          List your skills — people in your community are looking for trusted help right now.
        </div>
        <button
          onClick={() => router.push("/services/register")}
          className="w-full sm:w-auto px-4 py-2.5 bg-yellow-500 text-gray-900 text-sm font-bold rounded-lg hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center justify-center gap-2 shadow-md"
        >
          <Wrench className="w-4 h-4" />
          Register as Service Provider
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_SERVICES.map((service) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.label}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-xs font-semibold text-yellow-800"
              >
                <IconComponent className="w-3 h-3" />
                {service.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "browse") {
    return (
      <div className="m-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
        <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
          Are you a service provider?
        </div>
        <div className="text-base font-bold mb-1">
          List yourself — it's free
        </div>
        <div className="text-sm opacity-90 mb-3">
          Workers in {circleName || "your community"} are actively searching for trusted doctors,
          electricians, tutors & more.
        </div>
        <button
          onClick={() => router.push("/services/register")}
          className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-white flex items-center gap-2"
        >
          <Wrench className="w-4 h-4" />
          Register as Provider
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}

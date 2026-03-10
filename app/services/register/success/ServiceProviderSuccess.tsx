"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle,
  Share2,
  Copy,
  ExternalLink,
  Users,
  MessageCircle,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function ServiceProviderSuccess({
  providerId,
}: {
  providerId?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const [providerData, setProviderData] = useState<any>(null);
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);

  useEffect(() => {
    fetchProviderData();
    fetchPrimaryCircle();
  }, []);

  const fetchProviderData = async () => {
    // Fetch provider details if needed
    // For now, we'll use session data
  };

  const fetchPrimaryCircle = async () => {
    try {
      const res = await fetch("/api/community/circles");
      if (res.ok) {
        const data = await res.json();
        const all = [
          ...(data.circles.STATE || []),
          ...(data.circles.DISTRICT || []),
          ...(data.circles.MOHALLA || []),
        ];
        const primary = all.find((c: any) => c.isMember && c.level === "STATE");
        if (primary) {
          setPrimaryCircle(primary);
        }
      }
    } catch (error) {
      console.error("Failed to fetch circles:", error);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/services/provider/${session?.user?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToCircle = async () => {
    // TODO: Create a post in the circle about the new service provider
    if (primaryCircle) {
      router.push(
        `/community?circleId=${primaryCircle.id}&action=share-provider&providerId=${providerId}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-700">
      {/* Success Hero */}
      <div className="text-center px-4 py-12 sm:py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          You're live, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-green-100 text-sm sm:text-base">
          Your service profile is now visible
          <br />
          to workers in your community circles
        </p>
      </div>

      {/* Summary Card */}
      <div className="mx-auto max-w-2xl px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Category</span>
              <span className="text-sm font-bold text-gray-800">
                {providerData?.category || "Service Provider"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Services listed</span>
              <span className="text-sm font-bold text-gray-800">
                {providerData?.servicesCount || "Multiple"} services
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Community rate</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                ON
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Urgent requests</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                ON
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-500">Verified badge</span>
              <span className="text-xs font-semibold text-gray-400">
                Upload docs to get verified
              </span>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="text-sm font-bold text-gray-800 mb-4">
            Tell your community you're live!
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {primaryCircle && (
              <button
                onClick={handleShareToCircle}
                className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 rounded-lg bg-white hover:border-blue-500 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700">
                  Post to {primaryCircle.name}
                </span>
              </button>
            )}
            <button
              onClick={() => {
                const text = `Check out my services on REKKOMO! ${window.location.origin}/services/provider/${session?.user?.id}`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(text)}`,
                  "_blank"
                );
              }}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 rounded-lg bg-white hover:border-green-500 hover:bg-green-50 transition focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-gray-700">
                Share on WhatsApp
              </span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 rounded-lg bg-white hover:border-blue-500 hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-blue-600" />
              )}
              <span className="text-xs font-semibold text-gray-700">
                {copied ? "Copied!" : "Copy Profile Link"}
              </span>
            </button>
          </div>
        </div>

        {/* Verification Nudge */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-800">
              Get the verified badge
            </div>
            <div className="text-xs text-blue-700 mt-0.5">
              Upload your ID or skill certificate. Verified providers get 3× more
              inquiries.
            </div>
          </div>
          <button className="text-xs font-semibold text-blue-600 whitespace-nowrap hover:text-blue-700">
            Upload →
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push(`/services/provider/${session?.user?.id}`)}
            className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View My Profile
          </button>
          <button
            onClick={() => router.push("/services")}
            className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Browse Services
          </button>
        </div>
      </div>
    </div>
  );
}

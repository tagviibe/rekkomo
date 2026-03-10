"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Star,
  CheckCircle2,
  MapPin,
  Users,
  Clock,
  Home,
  Building2,
  Video,
  Phone,
  MoreVertical,
  MessageSquare,
  Share2,
} from "lucide-react";

type Provider = {
  id: string;
  userId: string;
  category: string;
  categoryName: string | null;
  languages: string[];
  serviceArea: string[];
  services: any;
  serviceScope: string | null;
  rate: string | null;
  ratingAvg: number;
  reviewCount: number;
  acceptsUrgent: boolean;
  communityDiscount: boolean;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    profile: {
      currentCity: string | null;
      nativePlaceState: string | null;
      profession: string | null;
      bio: string | null;
    } | null;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    reviewer: {
      id: string;
      name: string | null;
      image: string | null;
      profile: {
        nativePlaceState: string | null;
        trustScore: number | null;
      } | null;
    };
  }>;
  _count: {
    bookings: number;
    reviews: number;
  };
};

type ProviderProfileClientProps = {
  provider: Provider;
  currentUserId: string | null;
};

export default function ProviderProfileClient({
  provider,
  currentUserId,
}: ProviderProfileClientProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStateBadge = (state: string | null) => {
    if (!state) return null;
    const stateMap: Record<string, string> = {
      Odisha: "Odisha",
      "Uttar Pradesh": "UP",
      "West Bengal": "Bengal",
      Odisha: "Odisha",
      Jharkhand: "Jharkhand",
    };
    return stateMap[state] || state;
  };

  const getCategoryLabel = () => {
    if (provider.category === "OTHER" && provider.categoryName) {
      return provider.categoryName;
    }
    return provider.category.replace("_", " ");
  };

  const handleSendInquiry = () => {
    if (!currentUserId) {
      // Redirect to login if not authenticated
      router.push("/auth/signin");
      return;
    }
    // Navigate to chat/inquiry page
    if (provider.userId) {
      router.push(`/services/inquiry/${provider.userId}`);
    } else {
      console.error("Provider userId is missing");
    }
  };

  // Calculate response time
  const getResponseTime = () => {
    if (provider._count.bookings > 50) return "8m";
    if (provider._count.bookings > 20) return "15m";
    return "25m";
  };

  // Parse services from JSON
  const servicesList = Array.isArray(provider.services)
    ? provider.services
    : provider.services
    ? [provider.services]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="text-white relative overflow-hidden" style={{ background: "linear-gradient(150deg, var(--saffron-dark), var(--saffron))" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#C44E0E]/30 to-transparent" />
        <div className="relative px-4 pt-11 pb-14 max-w-4xl mx-auto sm:px-6 lg:px-8">
          {/* Back and Save Buttons */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition"
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-white" : ""}`} />
            </button>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-2.5">
              {provider.user.image ? (
                <img
                  src={provider.user.image}
                  alt={provider.user.name || "Provider"}
                  className="w-17 h-17 rounded-2xl border-2.5 border-white/30 object-cover"
                />
              ) : (
                <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border-2.5 border-white/30 flex items-center justify-center text-white font-black text-2xl">
                  {getInitials(provider.user.name)}
                </div>
              )}
              {provider.reviewCount >= 10 && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-lg font-black mb-1">{provider.user.name || "Service Provider"}</h1>
            <p className="text-xs text-white/65 mb-2.5">
              {getCategoryLabel()} · {getStateBadge(provider.user.profile?.nativePlaceState || null)} Origin
            </p>
            <div className="flex gap-1.5 flex-wrap justify-center">
              <span className="bg-white/10 border border-white/18 rounded-full px-2.5 py-1 text-xs font-bold text-white/80">
                ● Online Now
              </span>
              <span className="bg-white/10 border border-white/18 rounded-full px-2.5 py-1 text-xs font-bold text-white/80">
                💬 {provider.languages.slice(0, 2).join(" / ")}
              </span>
              {provider.user.profile?.currentCity && (
                <span className="bg-white/10 border border-white/18 rounded-full px-2.5 py-1 text-xs font-bold text-white/80">
                  📍 {provider.user.profile.currentCity}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg -mt-8 relative z-10 max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-4 divide-x divide-gray-200">
          <div className="p-3 text-center">
            <div className="text-base font-black mb-0.5" style={{ color: "var(--saffron-dark)" }}>
              {provider.ratingAvg > 0 ? `${provider.ratingAvg.toFixed(1)}★` : "New"}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Rating
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-base font-black text-gray-900 mb-0.5">
              {provider._count.reviews}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Reviews
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-base font-black mb-0.5" style={{ color: "var(--green)" }}>
              {provider._count.bookings}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Done
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-base font-black text-gray-900 mb-0.5">
              {getResponseTime()}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Resp.
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-4 pt-4 space-y-4.5 max-w-4xl mx-auto sm:px-6 lg:px-8">
        {/* About Section */}
        {provider.user.profile?.bio && (
          <div>
            <h2 className="text-xs font-black text-gray-900 mb-2.5 flex items-center gap-1.5">
              👤 About
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              {provider.user.profile.bio}
            </p>
          </div>
        )}

        {/* Services & Prices */}
        <div>
          <h2 className="text-xs font-black text-gray-900 mb-2.5 flex items-center gap-1.5">
            🏥 Services & Prices
          </h2>
          <div className="space-y-2">
            {servicesList.length > 0 ? (
              servicesList.map((service: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--saffron)";
                    e.currentTarget.style.background = "var(--saffron-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--cloud)";
                  }}
                >
                  <div className="text-lg flex-shrink-0">
                    {service.isUrgent ? "🚨" : service.name?.toLowerCase().includes("home") ? "🏠" : service.name?.toLowerCase().includes("clinic") ? "🏥" : "📱"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900">
                      {service.name || "Service"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {provider.serviceArea[0] || "Within 5 km"} · {service.isUrgent ? "within 1 hr" : "standard"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-green-700">
                      ₹{service.price || service.communityPrice || provider.rate || "N/A"}
                    </div>
                    {service.communityPrice && provider.communityDiscount && (
                      <div className="text-xs font-bold text-green-700 bg-green-50 rounded px-1.5 py-0.5 mt-0.5">
                        🌾 Comm. Rate
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="text-xs font-bold text-gray-900">
                  {getCategoryLabel()}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {provider.serviceArea[0] || "Within 5 km"}
                </div>
                {provider.rate && (
                  <div className="text-xs font-black text-green-700 mt-1">
                    ₹{provider.rate}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Community Vouches */}
        {provider.reviews.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-gray-900 mb-2.5 flex items-center gap-1.5">
              🤝 Community Vouches
            </h2>
            <div className="space-y-2">
              {provider.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl p-3"
                  style={{ background: "var(--saffron-light)", border: "1px solid rgba(232,98,26,.12)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {review.reviewer.image ? (
                      <img
                        src={review.reviewer.image}
                        alt={review.reviewer.name || "Reviewer"}
                        className="w-6.5 h-6.5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6.5 h-6.5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))" }}>
                        {getInitials(review.reviewer.name)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <div className="text-xs font-black text-gray-900">
                          {review.reviewer.name || "User"}
                        </div>
                        {review.reviewer.profile?.trustScore &&
                          review.reviewer.profile.trustScore > 100 && (
                            <span className="bg-green-50 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded">
                              Top Helper
                            </span>
                          )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getStateBadge(review.reviewer.profile?.nativePlaceState || null)} Circle ·{" "}
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-700 leading-relaxed mt-1.5">
                      {review.comment}
                    </p>
                  )}
                  <div className="flex gap-0.5 mt-1.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-20">
        <div className="max-w-4xl mx-auto flex gap-2">
          <button
            onClick={handleSendInquiry}
            className="flex-1 text-white font-black text-sm py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(232,98,26,.38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(232,98,26,.28)";
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Send Inquiry
          </button>
          <button 
            className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center transition"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--saffron)";
              e.currentTarget.style.background = "var(--saffron-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "white";
            }}
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            className="w-11 h-11 rounded-xl border border-gray-300 bg-white flex items-center justify-center transition"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--saffron)";
              e.currentTarget.style.background = "var(--saffron-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "white";
            }}
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

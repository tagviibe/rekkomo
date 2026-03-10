"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ServiceCategory } from "@prisma/client";
import {
  Search,
  MapPin,
  Star,
  Users,
  Zap,
  Wrench,
  Stethoscope,
  GraduationCap,
  Scale,
  Car,
  Hammer,
  Paintbrush,
  ChefHat,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import ServiceProviderEntryBanner from "@/components/ServiceProviderEntryBanner";

const SERVICE_CATEGORIES = [
  { value: "all", label: "All", icon: Filter },
  { value: ServiceCategory.ELECTRICIAN, label: "Electrician", icon: Zap },
  { value: ServiceCategory.PLUMBER, label: "Plumber", icon: Wrench },
  { value: ServiceCategory.DOCTOR, label: "Doctor", icon: Stethoscope },
  { value: ServiceCategory.TUTOR, label: "Tutor", icon: GraduationCap },
  { value: ServiceCategory.LAWYER, label: "Lawyer", icon: Scale },
  { value: ServiceCategory.DRIVER, label: "Driver", icon: Car },
  { value: ServiceCategory.CARPENTER, label: "Carpenter", icon: Hammer },
  { value: ServiceCategory.PAINTER, label: "Painter", icon: Paintbrush },
  { value: ServiceCategory.COOK, label: "Cook", icon: ChefHat },
  { value: ServiceCategory.CLEANER, label: "Cleaner", icon: Sparkles },
  { value: ServiceCategory.OTHER, label: "Other", icon: Wrench },
];

type ServiceProvider = {
  id: string;
  userId: string;
  category: ServiceCategory;
  categoryName: string | null;
  languages: string[];
  serviceArea: string[];
  services: any;
  serviceScope: string | null;
  rate: string | null;
  ratingAvg: number;
  reviewCount: number;
  bookingCount: number;
  acceptsUrgent: boolean;
  communityDiscount: boolean;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  profile: {
    currentCity: string | null;
    nativePlaceState: string | null;
    profession: string | null;
  } | null;
};

export default function ServicesBrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [originFilter, setOriginFilter] = useState(true); // State origin filter ON by default
  const [distanceFilter, setDistanceFilter] = useState<string>("all"); // Distance filter: "all", "5", "10", "15", "20"
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchProviders();
    fetchPrimaryCircle();
    fetchUserProfile();
  }, [selectedCategory, search, originFilter, distanceFilter]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
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

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`/api/services?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data.providers || [];

        // Filter by state origin if enabled
        if (originFilter && userProfile?.profile?.nativePlaceState) {
          const userState = userProfile.profile.nativePlaceState;
          // Prioritize same-state providers, but don't exclude others
          filtered = filtered.sort((a: ServiceProvider, b: ServiceProvider) => {
            const aState = a.profile?.nativePlaceState || "";
            const bState = b.profile?.nativePlaceState || "";
            if (aState === userState && bState !== userState) return -1;
            if (aState !== userState && bState === userState) return 1;
            return 0;
          });
        }

        // Filter by distance if enabled
        if (distanceFilter !== "all") {
          const maxDistance = parseFloat(distanceFilter);
          filtered = filtered.filter((provider: ServiceProvider) => {
            const distance = parseFloat(getDistance(provider));
            return distance <= maxDistance;
          });
        }

        setProviders(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: ServiceCategory) => {
    const cat = SERVICE_CATEGORIES.find((c) => c.value === category);
    return cat?.icon || Wrench;
  };

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

  const getCategoryLabel = (category: ServiceCategory, categoryName: string | null) => {
    if (category === ServiceCategory.OTHER && categoryName) {
      return categoryName;
    }
    return category.replace("_", " ");
  };

  // Calculate distance (mock for now - would use actual location data)
  // Using a hash of provider ID to get consistent distance per provider
  const getDistance = (provider: ServiceProvider) => {
    // Create a simple hash from provider ID for consistent distance
    let hash = 0;
    for (let i = 0; i < provider.id.length; i++) {
      hash = provider.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert to distance between 0.5 and 3.5 km
    const distance = 0.5 + (Math.abs(hash) % 30) / 10;
    return distance.toFixed(1);
  };

  // Calculate response time (mock for now)
  const getResponseTime = (provider: ServiceProvider) => {
    if (provider.bookingCount > 50) {
      return "~8 min";
    } else if (provider.bookingCount > 20) {
      return "~15 min";
    }
    return "~25 min";
  };

  // Check if provider is available (mock for now)
  const isAvailable = (provider: ServiceProvider) => {
    // Mock availability - would check actual availability
    return Math.random() > 0.3;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#C44E0E] via-[#E8621A] to-[#E8621A] text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--saffron-dark), var(--saffron))" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#C44E0E]/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="w-4 h-4" />
              <span>{userProfile?.profile?.currentCity || "Your Location"} ▾</span>
            </div>
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-7 h-7 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--saffron)" }}>
                {getInitials(session?.user?.name || null)}
              </div>
            )}
          </div>
          <h1 className="text-xl font-black mb-3 tracking-tight">
            Find services near you 🤝
          </h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Doctor, electrician, tailor..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
              />
              {primaryCircle && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold" style={{ background: "var(--saffron-light)", border: "1px solid rgba(232,98,26,.2)", color: "var(--saffron-dark)" }}>
                  {primaryCircle.name.includes("Odisha") || primaryCircle.name.includes("UP")
                    ? "Odisha/UP"
                    : primaryCircle.name}
                </div>
              )}
            </div>
            {/* Distance Filter */}
            <select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white text-gray-800 text-sm font-bold border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{ minWidth: "120px" }}
            >
              <option value="all">All Distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="15">Within 15 km</option>
              <option value="20">Within 20 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Strip */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SERVICE_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.value
                      ? "text-white border"
                      : "bg-white text-gray-600 border border-gray-300"
                  } focus:outline-none focus:ring-2`}
                  style={{
                    background: selectedCategory === cat.value ? "var(--saffron)" : undefined,
                    borderColor: selectedCategory === cat.value ? "var(--saffron)" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat.value) {
                      e.currentTarget.style.borderColor = "var(--saffron)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat.value) {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Origin Filter Banner */}
      {originFilter && userProfile?.profile?.nativePlaceState && (
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
          <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "linear-gradient(135deg, var(--saffron-light), #FFF8E0)", border: "1.5px solid rgba(232,98,26,.25)" }}>
            <span className="text-lg">🌾</span>
            <div className="flex-1 text-xs font-bold leading-tight" style={{ color: "var(--saffron-dark)" }}>
              Showing {getStateBadge(userProfile.profile.nativePlaceState)} &{" "}
              {userProfile.profile.nativePlaceState === "Odisha" ? "UP" : "Odisha"} providers
              first — same language, community trust
            </div>
            <div className="text-white text-xs font-black px-2.5 py-0.5 rounded-full" style={{ background: "var(--saffron)" }}>
              ON
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--saffron)", borderTopColor: "transparent" }} />
            <p className="mt-4 text-sm text-gray-500">Loading services...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold mb-2">No services found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or be the first to register as a service provider!
            </p>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="text-xs font-black text-gray-400 uppercase tracking-wider">
                {selectedCategory === "all"
                  ? "Services near you"
                  : `${getCategoryLabel(
                      selectedCategory as ServiceCategory,
                      null
                    )}s near you`}
              </div>
              <div className="text-xs font-bold cursor-pointer hover:underline" style={{ color: "var(--saffron)" }}>
                See all →
              </div>
            </div>

            {/* Provider Cards */}
            <div className="space-y-2.5">
              {providers.map((provider, index) => {
                const CategoryIcon = getCategoryIcon(provider.category);
                const stateBadge = getStateBadge(provider.profile?.nativePlaceState || null);
                const distance = getDistance(provider);
                const responseTime = getResponseTime(provider);
                const available = isAvailable(provider);
                const isTopProvider = provider.ratingAvg >= 4.8 && provider.reviewCount >= 20;

                return (
                  <div
                    key={provider.id}
                    onClick={() => router.push(`/services/provider/${provider.userId}`)}
                    className="bg-white rounded-2xl border border-gray-200 p-3.5 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--saffron)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    {isTopProvider && (
                      <div className="absolute top-0 right-0 text-gray-900 text-xs font-black px-2.5 py-1 rounded-bl-2xl rounded-tr-2xl" style={{ background: "var(--saffron)" }}>
                        ⭐ Top
                      </div>
                    )}

                    <div className="flex gap-3 items-start">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {provider.user.image ? (
                          <img
                            src={provider.user.image}
                            alt={provider.user.name || "Provider"}
                            className="w-11 h-11 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold text-base">
                            {getInitials(provider.user.name)}
                          </div>
                        )}
                        <div
                          className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            available ? "bg-green-500" : "bg-amber-500"
                          }`}
                        />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        {/* Name Row */}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="font-black text-sm text-gray-900 truncate">
                            {provider.user.name || "Service Provider"}
                          </div>
                          {provider.reviewCount >= 10 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          )}
                        </div>

                        {/* Occupation */}
                        <div className="text-xs text-gray-600 mb-1.5">
                          {getCategoryLabel(provider.category, provider.categoryName)} ·{" "}
                          {provider.profile?.currentCity || "Location"}
                        </div>

                        {/* Tags */}
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {stateBadge && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-bold rounded">
                              🌾 {stateBadge} Origin
                            </span>
                          )}
                          {provider.languages.slice(0, 2).map((lang) => (
                            <span
                              key={lang}
                              className="px-2 py-0.5 text-xs font-bold rounded"
                              style={{ background: "var(--saffron-light)", color: "var(--saffron-dark)" }}
                            >
                              {lang}
                            </span>
                          ))}
                          {provider.communityDiscount && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded">
                              Community Rate
                            </span>
                          )}
                        </div>

                        {/* Bottom Row */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-black text-gray-900">
                              {provider.ratingAvg > 0
                                ? provider.ratingAvg.toFixed(1)
                                : "New"}
                            </span>
                            {provider.reviewCount > 0 && (
                              <span className="text-xs text-gray-500">
                                ({provider.reviewCount})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">·</span>
                          <span className="text-xs text-gray-500">{distance} km</span>
                          <div className="ml-auto text-right">
                            {provider.rate && (
                              <>
                                <div className="text-sm font-black text-green-700">
                                  ₹{provider.rate}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                  {provider.services && Array.isArray(provider.services) && provider.services[0]
                                    ? provider.services[0].name?.toLowerCase() || "service"
                                    : "starting price"}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div
                          className={`mt-2 pt-2 border-t border-gray-100 text-xs flex items-center gap-1.5 ${
                            available ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {available ? (
                            <>
                              <Clock className="w-3 h-3" />
                              <span className="font-bold">
                                Responds in {responseTime} · Available today
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span className="font-medium">
                                Busy until 3pm · Responds ~{responseTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Entry Point Banner */}
        <div className="mt-6">
          <ServiceProviderEntryBanner
            circleName={primaryCircle?.name}
            variant="browse"
          />
        </div>
      </div>
    </div>
  );
}

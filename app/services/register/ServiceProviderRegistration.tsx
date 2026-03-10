"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ServiceCategory } from "@prisma/client";
import {
  Wrench,
  Stethoscope,
  GraduationCap,
  Scale,
  Car,
  Zap,
  Hammer,
  Paintbrush,
  ChefHat,
  Sparkles,
  X,
  ChevronRight,
  Check,
  Globe,
  MapPin,
  AlertCircle,
  Lightbulb,
  Users,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";

const SERVICE_CATEGORIES = [
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

const LANGUAGES = [
  "Assamese",
  "Bengali",
  "Bhojpuri",
  "Bodo",
  "Dogri",
  "English",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
];

type Service = {
  id: string;
  name: string;
  price: string;
  communityPrice?: string;
  isUrgent?: boolean;
};

export default function ServiceProviderRegistration() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);

  // Step 1: Category
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [otherCategoryName, setOtherCategoryName] = useState("");
  const [occupation, setOccupation] = useState("");

  // Step 2: Services & Prices
  const [services, setServices] = useState<Service[]>([]);
  const [communityDiscount, setCommunityDiscount] = useState(true);

  // Step 3: Final Details
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState(5);
  const [acceptsUrgent, setAcceptsUrgent] = useState(true);
  const [serviceScope, setServiceScope] = useState<"community" | "global" | "both">("both");

  useEffect(() => {
    fetchUserProfile();
    fetchPrimaryCircle();
  }, []);

  useEffect(() => {
    if (userProfile?.profile?.profession) {
      setOccupation(userProfile.profile.profession);
    }
    if (userProfile?.profile?.languages) {
      setSelectedLanguages(userProfile.profile.languages || []);
    }
  }, [userProfile]);

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

  const progress = ((currentStep - 1) / 3) * 100;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedCategory) {
        setError("Please select a service category");
        return;
      }
      if (selectedCategory === ServiceCategory.OTHER && !otherCategoryName.trim()) {
        setError("Please enter your service category name");
        return;
      }
      if (selectedCategory === ServiceCategory.OTHER && otherCategoryName.trim().length < 2) {
        setError("Service category name must be at least 2 characters");
        return;
      }
      setError(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (services.length === 0) {
        setError("Please add at least one service");
        return;
      }
      // Validate all services have name and price
      const invalidServices = services.filter(
        (s) => !s.name.trim() || !s.price.trim()
      );
      if (invalidServices.length > 0) {
        setError("Please fill in all service names and prices");
        return;
      }
      setError(null);
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const addService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      name: "",
      price: "",
      communityPrice: communityDiscount ? "" : undefined,
      isUrgent: false,
    };
    setServices([...services, newService]);
  };

  const removeService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
    );
  };

  const handleSubmit = async () => {
    if (selectedLanguages.length === 0) {
      setError("Please select at least one language");
      return;
    }

    if (!serviceScope) {
      setError("Please select service availability (Community/Global/Both)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/services/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          categoryName: selectedCategory === ServiceCategory.OTHER ? otherCategoryName : null,
          services: services.map((s) => ({
            name: s.name,
            price: s.price,
            communityPrice: s.communityPrice,
            isUrgent: s.isUrgent,
          })),
          languages: selectedLanguages,
          serviceArea: [`Within ${serviceArea} km`], // Convert to string array
          serviceScope, // Add service scope (community/global/both)
          acceptsUrgent,
          communityDiscount,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to register as service provider");
      }

      const result = await res.json();
      router.push(`/services/register/success?providerId=${result.provider.id}`);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get suggested services based on category
  const getSuggestedServices = () => {
    if (!selectedCategory) return [];
    const suggestions: Record<ServiceCategory, string[]> = {
      [ServiceCategory.ELECTRICIAN]: [
        "Basic Repair (switch/socket)",
        "Full Wiring Job",
        "Emergency Call (30 min)",
      ],
      [ServiceCategory.PLUMBER]: [
        "Tap Repair",
        "Pipe Installation",
        "Emergency Leak Fix",
      ],
      [ServiceCategory.DOCTOR]: [
        "General Consultation",
        "Home Visit",
        "Teleconsultation",
      ],
      [ServiceCategory.TUTOR]: [
        "Math Tutoring (per hour)",
        "Science Tutoring (per hour)",
        "Group Classes",
      ],
      [ServiceCategory.LAWYER]: [
        "Legal Consultation",
        "Document Review",
        "Court Representation",
      ],
      [ServiceCategory.DRIVER]: [
        "Local Ride",
        "Airport Drop",
        "Full Day Hire",
      ],
      [ServiceCategory.CARPENTER]: [
        "Furniture Repair",
        "Custom Furniture",
        "Installation",
      ],
      [ServiceCategory.PAINTER]: [
        "Room Painting",
        "Wall Repair",
        "Full House Painting",
      ],
      [ServiceCategory.COOK]: [
        "Daily Cooking",
        "Party Catering",
        "Tiffin Service",
      ],
      [ServiceCategory.CLEANER]: [
        "House Cleaning",
        "Office Cleaning",
        "Deep Cleaning",
      ],
      [ServiceCategory.OTHER]: [],
    };
    return suggestions[selectedCategory] || [];
  };

  const suggestedServices = getSuggestedServices();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Steps */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    currentStep > step
                      ? "bg-green-500 text-white"
                      : currentStep === step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                <div className="ml-2 hidden sm:block">
                  <div className="text-xs font-semibold text-gray-600">
                    {step === 1 && "Category"}
                    {step === 2 && "Services"}
                    {step === 3 && "Details"}
                  </div>
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Step 1: Category */}
        {currentStep === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Step 1 of 3
              </div>
              <div className="text-lg font-bold text-gray-800 mt-1">
                What service do you offer?
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Pick the category that matches your skill. You can add more later.
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {SERVICE_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setError(null);
                        // Auto-suggest services
                        if (suggestedServices.length > 0 && services.length === 0) {
                          const newServices = suggestedServices.slice(0, 3).map(
                            (name, idx) => ({
                              id: `suggested-${idx}`,
                              name,
                              price: "",
                              communityPrice: communityDiscount ? "" : undefined,
                              isUrgent: idx === 2,
                            })
                          );
                          setServices(newServices);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        selectedCategory === cat.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <IconComponent
                        className={`w-6 h-6 mx-auto mb-2 ${
                          selectedCategory === cat.value
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                      <div
                        className={`text-xs font-semibold ${
                          selectedCategory === cat.value
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        {cat.label}
                      </div>
                      {selectedCategory === cat.value && (
                        <Check className="w-4 h-4 mx-auto mt-1 text-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Other Category Input */}
              {selectedCategory === ServiceCategory.OTHER && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Enter your service category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherCategoryName}
                    onChange={(e) => {
                      setOtherCategoryName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g., Mechanic, Tailor, Photographer"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  {otherCategoryName.trim().length < 2 && otherCategoryName.length > 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      Please enter at least 2 characters
                    </p>
                  )}
                </div>
              )}

              {/* Confirmed Occupation */}
              {occupation && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">
                      Your occupation
                    </div>
                    <div className="text-xs text-gray-500">
                      Auto-filled from your profile
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-800">{occupation}</div>
                  <button
                    onClick={() => setOccupation("")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Services & Prices */}
        {currentStep === 2 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Step 2 of 3
              </div>
              <div className="text-lg font-bold text-gray-800 mt-1">
                What do you charge?
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Be specific — seekers trust providers who are upfront about prices.
              </div>
            </div>

            <div className="p-6">
              <div className="w-full border border-gray-200 rounded-xl overflow-hidden">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className={`grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 last:border-0 ${
                      service.isUrgent ? "bg-red-50" : ""
                    }`}
                  >
                    <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                      Service {index + 1}
                      {service.isUrgent && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-3 md:col-span-2 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Service Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) =>
                            updateService(service.id, "name", e.target.value)
                          }
                          placeholder="e.g., Basic Repair (switch/socket)"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Price (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) =>
                              updateService(service.id, "price", e.target.value)
                            }
                            placeholder="150"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>
                        {communityDiscount && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              Community Price (₹)
                            </label>
                            <input
                              type="number"
                              value={service.communityPrice || ""}
                              onChange={(e) =>
                                updateService(
                                  service.id,
                                  "communityPrice",
                                  e.target.value
                                )
                              }
                              placeholder="120"
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => removeService(service.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={addService}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="text-lg">+</span>
                    Add another service
                  </button>
                </div>
              </div>

              {/* Community Discount Toggle */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                <Users className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-yellow-800">
                    Offer community rate?
                  </div>
                  <div className="text-xs text-yellow-700">
                    Discounted price for same-state workers
                  </div>
                </div>
                <button
                  onClick={() => setCommunityDiscount(!communityDiscount)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    communityDiscount ? "bg-yellow-500" : "bg-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      communityDiscount ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Tip */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-green-800 font-medium">
                  Providers with a community rate get{" "}
                  <strong>2× more inquiries</strong> from community members.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Final Details */}
        {currentStep === 3 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Step 3 of 3
              </div>
              <div className="text-lg font-bold text-gray-800 mt-1">
                Almost done!
              </div>
              <div className="text-sm text-gray-500 mt-1">
                A few details so seekers know how to reach you.
              </div>
            </div>

            <div className="p-6">
              <div className="w-full border border-gray-200 rounded-xl overflow-hidden">
                {/* Languages */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Languages you speak <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            selectedLanguages.includes(lang)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          {selectedLanguages.includes(lang) && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Service Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    How far will you travel?
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Service area</span>
                        <span className="font-semibold text-blue-600">
                          Within {serviceArea} km
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full">
                        <div
                          className="absolute h-2 bg-blue-600 rounded-full"
                          style={{ width: `${(serviceArea / 15) * 100}%` }}
                        />
                        <input
                          type="range"
                          min="1"
                          max="15"
                          value={serviceArea}
                          onChange={(e) => setServiceArea(Number(e.target.value))}
                          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1 km</span>
                        <span>15 km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Scope - Community/Global */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Service Availability <span className="text-red-500 ml-0.5">*</span>
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="radio"
                          name="serviceScope"
                          value="community"
                          checked={serviceScope === "community"}
                          onChange={(e) => setServiceScope(e.target.value as "community" | "global" | "both")}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Community Only
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Only visible to members of your connected circles
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="radio"
                          name="serviceScope"
                          value="global"
                          checked={serviceScope === "global"}
                          onChange={(e) => setServiceScope(e.target.value as "community" | "global" | "both")}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Global
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Visible to everyone in your service area
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="radio"
                          name="serviceScope"
                          value="both"
                          checked={serviceScope === "both"}
                          onChange={(e) => setServiceScope(e.target.value as "community" | "global" | "both")}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <Globe className="w-4 h-4" />
                            Both (Recommended)
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Visible to both community members and global users in your area
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Urgent Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-gray-100 last:border-0">
                  <div className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-50 md:col-span-1 flex items-center">
                    Accept urgent requests?
                  </div>
                  <div className="px-4 py-3 md:col-span-2">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-red-800">
                          Accept urgent requests?
                        </div>
                        <div className="text-xs text-red-700">
                          I can respond within 1 hour for emergencies
                        </div>
                      </div>
                      <button
                        onClick={() => setAcceptsUrgent(!acceptsUrgent)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          acceptsUrgent ? "bg-red-600" : "bg-gray-300"
                        } focus:outline-none focus:ring-2 focus:ring-red-500`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            acceptsUrgent ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* What they get */}
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-xs font-semibold text-gray-800 mb-3">
                    When you go live, you'll get:
                  </div>
                  <div className="space-y-2">
                    {[
                      "Listed in community service search",
                      "Profile shareable link",
                      "Inquiries direct to your chat",
                      "Verified badge — after document upload",
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ← Previous
              </button>
            ) : (
              <div />
            )}
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !selectedCategory) ||
                  (currentStep === 2 && services.length === 0)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto"
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || selectedLanguages.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 ml-auto flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Going Live...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Go Live Now!
                  </>
                )}
              </button>
            )}
          </div>
          {currentStep === 3 && (
            <div className="text-center text-xs text-gray-500 mt-2">
              Free to list · You can edit anytime from your profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

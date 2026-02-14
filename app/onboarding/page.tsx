"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import {
  HiOutlineMapPin,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineLanguage,
  HiOutlineUsers,
} from "react-icons/hi2";
import { trackEvent } from "@/lib/analytics";

const steps = ["Location", "About You", "Needs", "Community"];
const LANGUAGES = [
  "Assamese",
  "Bengali",
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
const NEEDS = [
  "Housing/Roommates",
  "Job Opportunities",
  "Tiffin/Home Food",
  "Packers & Movers",
  "Local Services",
  "Community Events",
  "Friends/Networking",
];
const OFFER = [
  "Job Referrals",
  "Housing Listing",
  "Services",
  "Community Support",
  "Event Hosting",
];
const COMMUNITY_TAGS = [
  "Odia",
  "Telugu",
  "Marathi",
  "Hindi",
  "Bengali",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Other",
];
const INTERESTS = [
  "Cricket",
  "Food",
  "Movies",
  "Trekking",
  "Dev/Tech",
  "Startups",
  "Music",
  "Fitness",
  "Temple visits",
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  const {
    register,
    setValue,
    watch,
    getValues,
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      bio: "",
      phone: "",
      currentCity: "",
      currentLocality: "",
      nativePlaceCity: "",
      nativePlaceState: "",
      gender: "",
      dateOfBirth: "",
      languagesSpoken: [] as string[],
      profession: "",
      movedToCityWhen: "",
      needs: [] as string[],
      canOffer: [] as string[],
      communities: [] as string[],
      interests: [] as string[],
      profileVisibility: "COMMUNITY_ONLY",
      showNativePlace: true,
      showActivity: true,
      allowFollow: true,
      email: "",
      password: "",
    },
  });
  const currentCity = watch("currentCity");
  const nativePlaceCity = watch("nativePlaceCity");
  const nativePlaceState = watch("nativePlaceState");
  const languagesSpoken = watch("languagesSpoken");
  const profession = watch("profession");
  const needs = watch("needs");
  const communities = watch("communities");
  const interests = watch("interests");
  const showNativePlace = watch("showNativePlace");
  const showActivity = watch("showActivity");
  const allowFollow = watch("allowFollow");
  const profileVisibility = watch("profileVisibility");
  const [currentCityOptions, setCurrentCityOptions] = useState<string[]>([]);
  const [nativeCityOptions, setNativeCityOptions] = useState<string[]>([]);
  const [nativeStateOptions, setNativeStateOptions] = useState<string[]>([]);

  const isLast = step === steps.length - 1;
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step]
  );

  const toggle = (
    key:
      | "languagesSpoken"
      | "needs"
      | "canOffer"
      | "communities"
      | "interests",
    value: string
  ) => {
    const list = (getValues(key) ?? []) as string[];
    const next = list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
    setValue(key, next, { shouldDirty: true });
  };

  const saveOnboarding = async (payload: ReturnType<typeof getValues>) => {
    const { email, password, ...safePayload } = payload;
    const res = await fetch("/api/profile/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...safePayload,
        name: safePayload.name || email.split("@")[0] || "User",
        currentCountry: "India",
        originState: safePayload.nativePlaceState,
        originCity: safePayload.nativePlaceCity,
        languages: safePayload.languagesSpoken,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to save");
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (status !== "authenticated") {
        const email = getValues("email").trim();
        const password = getValues("password");
        if (!email || !password) {
          setError("Email and password are required to continue.");
          setLoading(false);
          return;
        }
        const draft = getValues();
        const { email: draftEmail, password: draftPassword, ...draftRest } = draft;
        localStorage.setItem("onboardingDraft", JSON.stringify(draftRest));

        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (signInRes?.error) {
          const registerRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: getValues("name") || email.split("@")[0],
              email,
              password,
            }),
          });
          if (registerRes.status === 409) {
            setError("Email already in use. Please log in.");
            setLoading(false);
            return;
          }
          if (!registerRes.ok) {
            const data = await registerRes.json();
            throw new Error(data.error ?? "Failed to register");
          }

          const signInAfterRegister = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (signInAfterRegister?.error) {
            throw new Error("Login failed. Check your credentials.");
          }
        }
        router.replace("/onboarding?resume=1");
        return;
      }

      await saveOnboarding(getValues());
      trackEvent("onboarding_complete", { step: steps.length });
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    const checkProfile = async () => {
      setCheckingProfile(true);
      try {
        const res = await fetch("/api/profile/me");
        if (!res.ok) return;
        const data = await res.json();
        const profile = data.profile;
        const completed = Boolean(profile?.onboardingCompleted);
        setProfileComplete(completed);
        if (completed) {
          router.replace("/home");
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [status, router]);

  useEffect(() => {
    const resume = searchParams.get("resume");
    if (status === "authenticated" && resume === "1") {
      const cached = localStorage.getItem("onboardingDraft");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          reset({ ...getValues(), ...parsed });
        } catch {
          localStorage.removeItem("onboardingDraft");
        }
      }
    }
  }, [status, searchParams, router]);

  useEffect(() => {
    const query = currentCity.trim();
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setCurrentCityOptions([]);
        return;
      }
      const res = await fetch(`/api/geo/places?type=city&q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentCityOptions((data.items ?? []).map((item: { value: string }) => item.value));
    }, 250);
    return () => clearTimeout(timeout);
  }, [currentCity]);

  useEffect(() => {
    const query = nativePlaceCity.trim();
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setNativeCityOptions([]);
        return;
      }
      const res = await fetch(`/api/geo/places?type=city&q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      setNativeCityOptions((data.items ?? []).map((item: { value: string }) => item.value));
    }, 250);
    return () => clearTimeout(timeout);
  }, [nativePlaceCity]);

  useEffect(() => {
    const query = nativePlaceState.trim();
    const timeout = setTimeout(async () => {
      if (query.length < 2) {
        setNativeStateOptions([]);
        return;
      }
      const res = await fetch(`/api/geo/places?type=state&q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      setNativeStateOptions((data.items ?? []).map((item: { value: string }) => item.value));
    }, 250);
    return () => clearTimeout(timeout);
  }, [nativePlaceState]);

  const canContinue =
    (step === 0 && Boolean(currentCity)) ||
    (step === 1 && languagesSpoken.length > 0 && Boolean(profession)) ||
    (step === 2 && needs.length > 0) ||
    step === 3;

  const handleNext = () => {
    if (!canContinue) {
      if (step === 0) {
        setError("Please select your current city.");
      } else if (step === 1) {
        setError("Select at least one language and a profession.");
      } else if (step === 2) {
        setError("Select at least one need.");
      }
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const watchedValues = watch();
  useEffect(() => {
    const { email, password, ...draft } = watchedValues;
    localStorage.setItem("onboardingDraft", JSON.stringify(draft));
  }, [watchedValues]);

  useEffect(() => {
    trackEvent("onboarding_step_view", { step: step + 1 });
  }, [step]);

  if (status === "loading" || checkingProfile) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading your profile...</p>
      </main>
    );
  }

  if (profileComplete) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <HiOutlineSparkles /> Homely onboarding
        </div>
        <h1 className="mt-2 text-2xl font-semibold">
          Let’s personalize your feed
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Step {step + 1} of {steps.length}
        </p>
        <div className="mt-4 h-2 w-full rounded bg-slate-200">
          <div
            className="h-2 rounded bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="text-blue-600" />
            Privacy controls are yours
          </div>
          <div className="flex items-center gap-2">
            <HiOutlineUsers className="text-blue-600" />
            Better people + community matches
          </div>
        </div>
      </header>

      {step === 0 && (
        <section className="space-y-4 rounded-2xl border bg-white p-6">
          {status !== "authenticated" && (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <HiOutlineUser /> Create your account
              </h2>
              <input
                className="w-full rounded border bg-white p-2"
                placeholder="Email"
                type="email"
                {...register("email")}
              />
              <input
                className="w-full rounded border bg-white p-2"
                placeholder="Password"
                type="password"
                {...register("password")}
              />
            </div>
          )}
          <input
            className="w-full rounded border bg-white p-2"
            placeholder="Phone number (optional)"
            {...register("phone")}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <HiOutlineMapPin className="text-blue-600" /> Current city
          </label>
          <input
            list="current-cities"
            className="w-full rounded border bg-white p-2"
            placeholder="Select or type city"
            {...register("currentCity")}
          />
          <datalist id="current-cities">
            {currentCityOptions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          <input
            className="w-full rounded border bg-white p-2"
            placeholder="Locality / area (optional)"
            {...register("currentLocality")}
          />
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4 rounded-2xl border bg-white p-6">
          <div>
            <label className="block text-sm font-medium">
              Native place city (optional)
            </label>
            <input
              list="native-cities"
              className="mt-2 w-full rounded border bg-white p-2"
              placeholder="Select or type city"
              {...register("nativePlaceCity")}
            />
            <datalist id="native-cities">
              {nativeCityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Native place state (optional)
            </label>
            <input
              list="native-states"
              className="mt-2 w-full rounded border bg-white p-2"
              placeholder="Select or type state"
              {...register("nativePlaceState")}
            />
            <datalist id="native-states">
              {nativeStateOptions.map((state) => (
                <option key={state} value={state} />
              ))}
            </datalist>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <HiOutlineLanguage className="text-blue-600" /> Languages spoken *
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    languagesSpoken.includes(language)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "bg-white"
                  }`}
                  onClick={() => toggle("languagesSpoken", language)}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <HiOutlineBriefcase className="text-blue-600" /> Profession *
          </label>
          <select
            className="w-full rounded border bg-white p-2"
            {...register("profession")}
          >
            <option value="">Select</option>
            <option value="STUDENT">Student</option>
            <option value="IT_PROFESSIONAL">IT Professional</option>
            <option value="JOB_SEEKER">Job Seeker</option>
            <option value="FREELANCER">Freelancer</option>
            <option value="BUSINESS_OWNER">Business Owner</option>
            <option value="OTHER">Other</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-medium">
            <HiOutlineUser className="text-blue-600" /> Gender
          </label>
          <select
            className="w-full rounded border bg-white p-2"
            {...register("gender")}
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_SAY">Prefer not to say</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-medium">
            <HiOutlineCalendar className="text-blue-600" /> Date of birth
          </label>
          <input
            type="date"
            className="w-full rounded border bg-white p-2"
            {...register("dateOfBirth")}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <HiOutlineCalendar className="text-blue-600" /> Moved to city
          </label>
          <select
            className="w-full rounded border bg-white p-2"
            {...register("movedToCityWhen")}
          >
            <option value="">Select</option>
            <option value="MONTHS_0_3">0–3 months</option>
            <option value="MONTHS_3_12">3–12 months</option>
            <option value="YEAR_1_PLUS">1+ year</option>
          </select>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-2xl border bg-white p-6">
          <div>
            <p className="text-sm font-medium">What are you looking for? *</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {NEEDS.map((need) => (
                <button
                  key={need}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    needs.includes(need)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "bg-white"
                  }`}
                  onClick={() => toggle("needs", need)}
                >
                  {need}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">You can offer (optional)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OFFER.map((offer) => (
                <button
                  key={offer}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    watch("canOffer").includes(offer)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "bg-white"
                  }`}
                  onClick={() => toggle("canOffer", offer)}
                >
                  {offer}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded-2xl border bg-white p-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <HiOutlineTag className="text-blue-600" /> Communities (optional)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMUNITY_TAGS.map((communityTag) => (
                <button
                  key={communityTag}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    communities.includes(communityTag)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "bg-white"
                  }`}
                  onClick={() => toggle("communities", communityTag)}
                >
                  {communityTag}
                </button>
              ))}
            </div>
            {communities.includes("Other") && (
              <input
                className="mt-3 w-full rounded border bg-white p-2"
                placeholder="Add custom community tags (comma separated)"
                onChange={(event) => {
                  const next = [
                    ...communities.filter((c) => c !== "Other"),
                    ...event.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  ];
                  setValue("communities", next, { shouldDirty: true });
                }}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Interests (optional)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-sm ${
                    interests.includes(interest)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "bg-white"
                  }`}
                  onClick={() => toggle("interests", interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showNativePlace}
                onChange={(event) =>
                  setValue("showNativePlace", event.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              Show native place
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showActivity}
                onChange={(event) =>
                  setValue("showActivity", event.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              Show activity
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowFollow}
                onChange={(event) =>
                  setValue("allowFollow", event.target.checked, {
                    shouldDirty: true,
                  })
                }
              />
              Allow follow
            </label>
            <label className="block text-sm font-medium">Profile visibility</label>
            <select
              className="w-full rounded border bg-white p-2"
              value={profileVisibility}
              onChange={(event) =>
                setValue("profileVisibility", event.target.value, {
                  shouldDirty: true,
                })
              }
            >
              <option value="PUBLIC">Public</option>
              <option value="COMMUNITY_ONLY">Community only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </section>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <footer className="mt-8 flex items-center justify-between">
        <button
          className="rounded-lg border px-4 py-2"
          onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled={step === 0 || loading}
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          {step === 3 && (
            <button
              className="rounded-lg border px-4 py-2"
              onClick={submit}
              disabled={loading}
            >
              Skip for now
            </button>
          )}
          {isLast ? (
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              onClick={submit}
              disabled={loading || !canContinue}
            >
              {loading ? "Saving..." : "Finish"}
            </button>
          ) : (
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            onClick={handleNext}
            disabled={loading}
            >
              Continue
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}

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
import PlacesAutocomplete from "@/components/PlacesAutocomplete";
import { INDIA_STATES } from "@/lib/constants";

const steps = ["Create Account", "Location", "About You", "Role", "Needs"];

const PLATFORM_ROLES = [
  { value: "JOB_SEEKER", label: "Job Seeker", icon: "💼" },
  { value: "SERVICE_PROVIDER", label: "Service Provider", icon: "🔧" },
  { value: "EVENT_ORGANIZER", label: "Event Organizer", icon: "🎉" },
  { value: "COMMUNITY_MEMBER", label: "Community Member", icon: "👥" },
] as const;
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

type OnboardingFormValues = {
  name: string;
  firstName: string;
  lastName: string;
  bio: string;
  phone: string;
  otpCode: string;
  email: string;
  password: string;
  currentCity: string;
  currentLocality: string;
  nativePlaceCity: string;
  nativePlaceState: string;
  gender: string;
  dateOfBirth: string;
  languagesSpoken: string[];
  profession: string;
  movedToCityWhen: string;
  needs: string[];
  canOffer: string[];
  communities: string[];
  interests: string[];
  platformRoles: ("JOB_SEEKER" | "SERVICE_PROVIDER" | "EVENT_ORGANIZER" | "COMMUNITY_MEMBER")[];
  profileVisibility: "PUBLIC" | "COMMUNITY_ONLY" | "PRIVATE";
  showNativePlace: boolean;
  showActivity: boolean;
  allowFollow: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone");
  const [emailLoggingIn, setEmailLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);

  const {
    register,
    setValue,
    watch,
    getValues,
    reset,
  } = useForm<OnboardingFormValues>({
    defaultValues: {
      name: "",
      firstName: "",
      lastName: "",
      bio: "",
      phone: "",
      otpCode: "",
      email: "",
      password: "",
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
      platformRoles: ["COMMUNITY_MEMBER"],
      profileVisibility: "COMMUNITY_ONLY",
      showNativePlace: true,
      showActivity: true,
      allowFollow: true,
    },
  });
  const phone = watch("phone");
  const otpCode = watch("otpCode");
  const email = watch("email");
  const password = watch("password");
  const currentCity = watch("currentCity");
  const nativePlaceCity = watch("nativePlaceCity");
  const nativePlaceState = watch("nativePlaceState");
  const languagesSpoken = watch("languagesSpoken");
  const profession = watch("profession");
  const needs = watch("needs");
  const communities = watch("communities");
  const interests = watch("interests");
  const platformRoles = watch("platformRoles");
  const showNativePlace = watch("showNativePlace");
  const showActivity = watch("showActivity");
  const allowFollow = watch("allowFollow");
  const profileVisibility = watch("profileVisibility");

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
      | "interests"
      | "platformRoles",
    value: string
  ) => {
    const list = (getValues(key) ?? []) as string[];
    const next = list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];
    setValue(key, next, { shouldDirty: true });
  };

  const saveOnboarding = async (payload: OnboardingFormValues) => {
    const { otpCode: otp, password: pwd, ...safePayload } = payload;
    const fullName = [safePayload.firstName, safePayload.lastName].filter(Boolean).join(" ") || safePayload.name || safePayload.phone || "User";
    const res = await fetch("/api/profile/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...safePayload,
        name: fullName,
        currentCountry: "India",
        originState: safePayload.nativePlaceState,
        originCity: safePayload.nativePlaceCity,
        languages: safePayload.languagesSpoken,
      }),
    });
    
    if (!res.ok) {
      let errorMessage = "Failed to save profile";
      try {
        const data = await res.json();
        errorMessage = data.error ?? errorMessage;
        if (data.details && process.env.NODE_ENV === "development") {
          console.error("Onboarding error details:", data.details);
        }
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await res.text();
          errorMessage = text || errorMessage;
        } catch {
          // Use default error message
        }
      }
      throw new Error(errorMessage);
    }
    
    // Ensure we have a valid response
    try {
      const data = await res.json();
      return data;
    } catch (e) {
      // If response is empty but status is OK, that's fine
      if (res.ok) {
        return { ok: true };
      }
      throw new Error("Invalid response from server");
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (status !== "authenticated") {
        setError("Verify OTP to continue.");
        setLoading(false);
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


  const firstName = watch("firstName");
  const lastName = watch("lastName");
  
  const canContinue =
    (step === 0 &&
      (status === "authenticated" || otpVerified)) ||
    (step === 1 && Boolean(currentCity) && Boolean(firstName) && Boolean(lastName)) ||
    (step === 2 && languagesSpoken.length > 0 && Boolean(profession)) ||
    (step === 3 && platformRoles.length > 0) ||
    (step === 4 && needs.length > 0);

  const handleNext = () => {
    if (!canContinue) {
      if (step === 0) {
        if (status !== "authenticated" && !otpVerified) {
          setError("Please create your account to continue.");
        }
      } else if (step === 1) {
        if (!currentCity) {
          setError("Please select your current city.");
        } else if (!firstName || !lastName) {
          setError("Please enter your first name and last name.");
        }
      } else if (step === 2) {
        if (languagesSpoken.length === 0 || !profession) {
          setError("Select at least one language and a profession.");
        }
      } else if (step === 3) {
        setError("Select at least one role.");
      } else if (step === 4) {
        setError("Select at least one need.");
      }
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const watchedValues = watch();
  useEffect(() => {
    const { otpCode, password, ...draft } = watchedValues;
    localStorage.setItem("onboardingDraft", JSON.stringify(draft));
  }, [watchedValues]);

  useEffect(() => {
    trackEvent("onboarding_step_view", { step: step + 1 });
  }, [step]);

  const requestOtp = async () => {
    if (!phone.trim()) {
      setError("Enter a valid phone number.");
      return;
    }
    setError(null);
    setOtpInfo(null);
    setOtpSending(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send OTP");
      }
      setOtpSent(true);
      setOtpValues(["", "", "", "", "", ""]);
      setValue("otpCode", "");
      if (data.otp) {
        setOtpInfo(`OTP: ${data.otp}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    const otpString = otpValues.join("");
    if (!phone.trim() || otpString.length < 6) {
      setError("Enter phone number and complete OTP.");
      return;
    }
    setError(null);
    setOtpVerifying(true);
    try {
      const res = await signIn("credentials", {
        phone: phone.trim(),
        otp: otpString,
        redirect: false,
      });
      if (res?.error) {
        throw new Error("Invalid OTP. Try again.");
      }
      setOtpVerified(true);
      const draft = getValues();
      const { otpCode: draftOtp, ...draftRest } = draft;
      localStorage.setItem("onboardingDraft", JSON.stringify(draftRest));
      router.replace("/onboarding?resume=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
      // Clear OTP on error
      setOtpValues(["", "", "", "", "", ""]);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    if (digit) {
      const newOtp = [...otpValues];
      newOtp[index] = digit;
      setOtpValues(newOtp);
      setValue("otpCode", newOtp.join(""));
      
      // Auto-focus next input
      if (index < 5) {
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement;
          nextInput?.focus();
        }, 0);
      } else {
        // Auto-verify when all 6 digits are entered
        setTimeout(() => {
          verifyOtp();
        }, 300);
      }
    } else {
      // Clear current digit
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
      setValue("otpCode", newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const newOtp = [...otpValues];
      newOtp[index - 1] = "";
      setOtpValues(newOtp);
      setValue("otpCode", newOtp.join(""));
      setTimeout(() => {
        const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement;
        prevInput?.focus();
      }, 0);
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtpValues(["", "", "", "", "", ""]);
    setValue("otpCode", "");
    setOtpInfo(null);
    setError(null);
  };

  const loginWithEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Enter email and password.");
      return;
    }
    setError(null);
    setEmailLoggingIn(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
      });
      if (res?.error) {
        throw new Error("Invalid email or password.");
      }
      setOtpVerified(true);
      const draft = getValues();
      const { otpCode: draftOtp, password: draftPassword, ...draftRest } = draft;
      localStorage.setItem("onboardingDraft", JSON.stringify(draftRest));
      router.replace("/onboarding?resume=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setEmailLoggingIn(false);
    }
  };

  // Early returns after all hooks
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
    <main 
      className="mx-auto max-w-[480px] py-10 min-h-screen"
      style={{ background: 'var(--color-paper)' }}
    >
      <div 
        className="bg-white rounded-[24px] border border-[var(--color-fog)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Progress Bar */}
        <div 
          className="h-1"
          style={{ background: 'var(--color-fog)' }}
        >
          <div
            className="h-full transition-all duration-400"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
              borderRadius: '2px'
            }}
          />
        </div>

        {/* Header */}
        <div className="px-8 pt-7">
          <div 
            className="text-[11px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--color-slate)' }}
          >
            Step {step + 1} of {steps.length}
          </div>
          <h1 
            className="text-2xl font-extrabold mb-1.5"
            style={{ color: 'var(--color-ink)', letterSpacing: '-0.5px' }}
          >
            {step === 0 && "Where are you now?"}
            {step === 1 && "Where are you now?"}
            {step === 2 && "Tell us about yourself"}
            {step === 3 && "What's your role?"}
            {step === 4 && "What do you need?"}
          </h1>
          <p 
            className="text-sm leading-relaxed mt-1.5"
            style={{ color: 'var(--color-slate)' }}
          >
            {step === 0 && "Create your account to get started"}
            {step === 1 && "Select your current city to connect with local communities"}
            {step === 2 && "Help us personalize your experience"}
            {step === 3 && "Choose how you want to use Rekkomo"}
            {step === 4 && "Let us know what you're looking for"}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">

          {step === 0 && (
            <div className="space-y-6">
              {status !== "authenticated" && (
                <div 
                  className="rounded-xl border p-4"
                  style={{ 
                    background: 'var(--color-cloud)',
                    borderColor: 'var(--color-fog)'
                  }}
                >
                  <h2 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                    <HiOutlineUser /> Create your account
                  </h2>
                  
                  {/* Login Mode Toggle */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setLoginMode("phone")}
                      className={`flex-1 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition-all ${
                        loginMode === "phone"
                          ? "bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                          : "bg-white border border-[var(--color-fog)] text-[var(--color-slate)]"
                      }`}
                    >
                      📱 Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMode("email")}
                      className={`flex-1 rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold transition-all ${
                        loginMode === "email"
                          ? "bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                          : "bg-white border border-[var(--color-fog)] text-[var(--color-slate)]"
                      }`}
                    >
                      📧 Email
                    </button>
                  </div>

                  {/* Phone OTP Login */}
                  {loginMode === "phone" && (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-ink)' }}>
                          Mobile Number
                        </label>
                        <div 
                          className="flex rounded-[12px] border-[1.5px] bg-white overflow-hidden transition-all"
                          style={{ 
                            borderColor: phone ? 'var(--color-primary)' : 'var(--color-fog)',
                            boxShadow: phone ? '0 0 0 4px rgba(232,98,26,0.1)' : '0 1px 3px rgba(43,79,212,0.04)'
                          }}
                        >
                          <div 
                            className="flex items-center gap-2 px-4 py-3.5 border-r border-[var(--color-fog)] cursor-pointer transition-colors"
                            style={{ 
                              background: 'var(--color-cloud)',
                              fontFamily: 'var(--font-primary)'
                            }}
                          >
                            <span className="text-lg">🇮🇳</span>
                            <span className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>+91</span>
                          </div>
                          <input
                            className="flex-1 border-none outline-none px-4 py-3.5 text-base font-semibold"
                            style={{ 
                              color: 'var(--color-ink)',
                              letterSpacing: '0.5px',
                              fontFamily: 'var(--font-primary)'
                            }}
                            placeholder="98765 43210"
                            type="tel"
                            maxLength={10}
                            {...register("phone")}
                          />
                        </div>
                      </div>
                      {!otpSent ? (
                        <button
                          type="button"
                          className="btn-primary w-full text-sm px-4 py-3.5 font-bold flex items-center justify-center gap-2"
                          onClick={requestOtp}
                          disabled={otpSending}
                          style={{
                            boxShadow: '0 4px 16px rgba(232,98,26,0.3)'
                          }}
                        >
                          {otpSending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              <span>📱</span>
                              Send OTP — It's Free
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <div 
                            className="flex items-center gap-3 rounded-xl p-4 mb-4"
                            style={{ 
                              background: 'var(--color-success-light)',
                              border: '1px solid rgba(5,150,105,0.2)'
                            }}
                          >
                            <span className="text-xl">📱</span>
                            <div className="flex-1">
                              <div className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                                OTP sent to
                              </div>
                              <div className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                                +91 {phone}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleChangeNumber}
                              className="text-xs font-semibold underline"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              Change number
                            </button>
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                              Enter 6-digit OTP
                            </label>
                            <div className="flex gap-2.5">
                              {[0, 1, 2, 3, 4, 5].map((index) => {
                                const char = otpValues[index] || '';
                                return (
                                  <input
                                    key={index}
                                    className="flex-1 aspect-square max-w-[56px] rounded-xl border-[1.5px] text-center text-2xl font-extrabold transition-all focus:outline-none"
                                    style={{
                                      borderColor: char ? 'var(--color-primary)' : 'var(--color-fog)',
                                      background: char ? 'var(--color-primary-light)' : 'white',
                                      color: char ? 'var(--color-primary)' : 'var(--color-ink)',
                                      boxShadow: char ? '0 1px 3px rgba(43,79,212,0.04)' : 'none'
                                    }}
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={char}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    data-otp-index={index}
                                    autoComplete="off"
                                  />
                                );
                              })}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-primary w-full text-sm px-4 py-3.5 font-bold flex items-center justify-center gap-2"
                            onClick={verifyOtp}
                            disabled={otpVerifying || otpValues.join("").length < 6}
                            style={{
                              background: 'linear-gradient(135deg, var(--color-success), #047857)',
                              boxShadow: '0 4px 16px rgba(5,150,105,0.3)'
                            }}
                          >
                            {otpVerifying ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <span>✅</span>
                                Verify & Continue
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {otpInfo && (
                        <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-slate)' }}>{otpInfo}</p>
                      )}
                      <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-[var(--color-fog)]">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-mist)' }}>
                          <span>🔒</span>
                          <span>No password ever</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-mist)' }}>
                          <span>🆓</span>
                          <span>Always free</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-mist)' }}>
                          <span>🛡️</span>
                          <span>Safe</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email/Password Login */}
                  {loginMode === "email" && (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-ink)' }}>
                          Email Address
                        </label>
                        <div 
                          className="flex rounded-[12px] border-[1.5px] bg-white overflow-hidden transition-all"
                          style={{ 
                            borderColor: email ? 'var(--color-primary)' : 'var(--color-fog)',
                            boxShadow: email ? '0 0 0 4px rgba(232,98,26,0.1)' : '0 1px 3px rgba(43,79,212,0.04)'
                          }}
                        >
                          <input
                            className="flex-1 border-none outline-none px-4 py-3.5 text-base font-semibold"
                            style={{ 
                              color: 'var(--color-ink)',
                              letterSpacing: '0.5px',
                              fontFamily: 'var(--font-primary)'
                            }}
                            placeholder="your@email.com"
                            type="email"
                            {...register("email")}
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-ink)' }}>
                          Password
                        </label>
                        <div 
                          className="flex rounded-[12px] border-[1.5px] bg-white overflow-hidden transition-all"
                          style={{ 
                            borderColor: password ? 'var(--color-primary)' : 'var(--color-fog)',
                            boxShadow: password ? '0 0 0 4px rgba(232,98,26,0.1)' : '0 1px 3px rgba(43,79,212,0.04)'
                          }}
                        >
                          <input
                            className="flex-1 border-none outline-none px-4 py-3.5 text-base font-semibold"
                            style={{ 
                              color: 'var(--color-ink)',
                              letterSpacing: '0.5px',
                              fontFamily: 'var(--font-primary)'
                            }}
                            placeholder="Enter password"
                            type="password"
                            {...register("password")}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-primary w-full text-sm px-4 py-3.5 font-bold flex items-center justify-center gap-2"
                        onClick={loginWithEmail}
                        disabled={emailLoggingIn}
                        style={{
                          boxShadow: '0 4px 16px rgba(232,98,26,0.3)'
                        }}
                      >
                        {emailLoggingIn ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <span>📧</span>
                            Create Account — It's Free
                          </>
                        )}
                      </button>
                      <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-[var(--color-fog)]">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-mist)' }}>
                          <span>🔒</span>
                          <span>Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-mist)' }}>
                          <span>🆓</span>
                          <span>Free</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-mist)' }}>
                          <span>🛡️</span>
                          <span>Safe</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {status === "authenticated" || otpVerified ? (
                <div className="rounded-xl border p-4" style={{ 
                  background: 'var(--color-success-light)',
                  borderColor: 'var(--color-success)'
                }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-success-dark)' }}>
                    ✓ Account created successfully! Continue to the next step.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-fog)] bg-white px-3 py-2.5 text-sm"
                    placeholder="First name"
                    {...register("firstName", { required: true })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-fog)] bg-white px-3 py-2.5 text-sm"
                    placeholder="Last name"
                    {...register("lastName", { required: true })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                  Current city *
                </label>
                <PlacesAutocomplete
                  value={currentCity || ""}
                  onChange={(value) => setValue("currentCity", value)}
                  placeholder="Select or type city"
                  type="city"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-fog)] bg-white px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                  Locality / area (optional)
                </label>
                <PlacesAutocomplete
                  value={watch("currentLocality") || ""}
                  onChange={(value) => setValue("currentLocality", value)}
                  placeholder="Select or type locality"
                  type="locality"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-fog)] bg-white px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                  Native Place State *
                </label>
                <p className="text-xs mb-4" style={{ color: 'var(--color-slate)' }}>
                  Select your home state to connect with your community
                </p>
                <div 
                  className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 rounded-xl"
                  style={{ 
                    border: '1.5px solid var(--color-fog)',
                    background: 'var(--color-cloud)'
                  }}
                >
                  {INDIA_STATES.map((state) => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setValue("nativePlaceState", state)}
                      className={`p-2.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all text-center ${
                        nativePlaceState === state
                          ? "text-white shadow-md scale-105"
                          : "bg-white border border-[var(--color-fog)] hover:border-[var(--color-primary)]"
                      }`}
                      style={{
                        background: nativePlaceState === state 
                          ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                          : 'white',
                        color: nativePlaceState === state ? 'white' : 'var(--color-ink)',
                        fontFamily: 'var(--font-primary)'
                      }}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
          <div>
            <label className="block text-sm font-bold text-warm-gray-dark mb-2">
              Native place city (optional)
            </label>
            <PlacesAutocomplete
              value={nativePlaceCity || ""}
              onChange={(value) => setValue("nativePlaceCity", value)}
              placeholder="Select or type city"
              type="city"
              className="mt-2 w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2"
            />
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-warm-gray-dark mb-3">
              <HiOutlineLanguage className="text-deep-blue" /> Languages spoken *
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                    languagesSpoken.includes(language)
                      ? "border-saffron bg-saffron/10 text-saffron-dark shadow-sm"
                      : "border-warm-paper-dark bg-white text-warm-gray hover:bg-warm-paper"
                  }`}
                  onClick={() => toggle("languagesSpoken", language)}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-warm-gray-dark">
            <HiOutlineBriefcase className="text-deep-blue" /> Profession *
          </label>
          <select
            className="w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2 text-warm-gray-dark"
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
          <label className="flex items-center gap-2 text-sm font-bold text-warm-gray-dark">
            <HiOutlineUser className="text-saffron" /> Gender
          </label>
          <select
            className="w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2 text-warm-gray-dark"
            {...register("gender")}
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_SAY">Prefer not to say</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-bold text-warm-gray-dark">
            <HiOutlineCalendar className="text-gold" /> Date of birth
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2 text-warm-gray-dark"
            {...register("dateOfBirth")}
          />
          <label className="flex items-center gap-2 text-sm font-bold text-warm-gray-dark">
            <HiOutlineCalendar className="text-gold" /> Moved to city
          </label>
          <select
            className="w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2 text-warm-gray-dark"
            {...register("movedToCityWhen")}
          >
            <option value="">Select</option>
            <option value="MONTHS_0_3">0–3 months</option>
            <option value="MONTHS_3_12">3–12 months</option>
            <option value="YEAR_1_PLUS">1+ year</option>
          </select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                  Select your role(s) *
                </p>
                <p className="mb-4 text-xs" style={{ color: 'var(--color-slate)' }}>
                  You can select multiple roles. You can change this later in settings.
                </p>
                <div 
                  className="grid gap-2.5"
                  style={{ gridTemplateColumns: '1fr 1fr' }}
                >
                  {PLATFORM_ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      className={`rounded-[14px] p-4 text-left transition-all border ${
                        platformRoles.includes(role.value as any)
                          ? "border-[var(--color-primary)]"
                          : "border-[var(--color-fog)] bg-white hover:border-[var(--color-primary)]"
                      }`}
                      onClick={() => toggle("platformRoles", role.value)}
                      style={{
                        background: platformRoles.includes(role.value as any)
                          ? 'var(--color-primary-light)'
                          : 'white',
                        fontFamily: 'var(--font-primary)'
                      }}
                    >
                      <span className="text-2xl block mb-2">{role.icon}</span>
                      <span 
                        className="text-[13px] font-bold block"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {role.label}
                      </span>
                      <span 
                        className="text-[11px] mt-0.5 block"
                        style={{ color: 'var(--color-slate)' }}
                      >
                        {role.value === "JOB_SEEKER" && "Find jobs in your community"}
                        {role.value === "SERVICE_PROVIDER" && "Offer your services"}
                        {role.value === "EVENT_ORGANIZER" && "Organize community events"}
                        {role.value === "COMMUNITY_MEMBER" && "Connect with your community"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                  What are you looking for? *
                </p>
                <div className="flex flex-wrap gap-2">
                  {NEEDS.map((need) => (
                    <button
                      key={need}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        needs.includes(need)
                          ? "border-[var(--color-primary)]"
                          : "border-[var(--color-fog)] bg-white hover:border-[var(--color-primary)]"
                      }`}
                      onClick={() => toggle("needs", need)}
                      style={{
                        background: needs.includes(need)
                          ? 'var(--color-primary-light)'
                          : 'white',
                        color: needs.includes(need)
                          ? 'var(--color-primary)'
                          : 'var(--color-ink)',
                        fontFamily: 'var(--font-primary)'
                      }}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>
                  You can offer (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {OFFER.map((offer) => (
                    <button
                      key={offer}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        watch("canOffer").includes(offer)
                          ? "border-[var(--color-success)]"
                          : "border-[var(--color-fog)] bg-white hover:border-[var(--color-success)]"
                      }`}
                      onClick={() => toggle("canOffer", offer)}
                      style={{
                        background: watch("canOffer").includes(offer)
                          ? 'var(--color-success-light)'
                          : 'white',
                        color: watch("canOffer").includes(offer)
                          ? 'var(--color-success-dark)'
                          : 'var(--color-ink)',
                        fontFamily: 'var(--font-primary)'
                      }}
                    >
                      {offer}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}


          {error && (
            <p className="mt-4 text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--color-fog)]">
            <button
              className="rounded-[var(--radius-md)] border border-[var(--color-fog)] bg-white px-4 py-2.5 text-sm font-semibold transition-all"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0 || loading}
              style={{
                fontFamily: 'var(--font-primary)',
                color: step === 0 || loading ? 'var(--color-mist)' : 'var(--color-ink)',
                cursor: step === 0 || loading ? 'not-allowed' : 'pointer'
              }}
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              {step === 4 && (
                <button
                  className="rounded-[var(--radius-md)] border border-[var(--color-fog)] bg-white px-4 py-2.5 text-sm font-semibold transition-all"
                  onClick={submit}
                  disabled={loading}
                  style={{
                    fontFamily: 'var(--font-primary)',
                    color: loading ? 'var(--color-mist)' : 'var(--color-ink)',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Skip for now
                </button>
              )}
              {isLast ? (
                <button
                  className="btn-primary px-6 py-2.5 text-sm"
                  onClick={submit}
                  disabled={loading || !canContinue}
                >
                  {loading ? "Saving..." : "Finish"}
                </button>
              ) : (
                <button
                  className="btn-primary px-6 py-2.5 text-sm"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

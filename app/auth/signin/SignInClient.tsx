"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SignInPage() {
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "hi" | "bn" | "od">("en");
  const [countdown, setCountdown] = useState(0);
  const [liveCount, setLiveCount] = useState(1247);
  const [screen, setScreen] = useState<"phone" | "otp" | "email" | "success">("phone");
  const [step, setStep] = useState(1);
  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoggingIn, setEmailLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const callback = searchParams.get("callback") ?? "/home";
  const modeParam = searchParams.get("mode");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Live count animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => {
        const change = Math.floor(Math.random() * 3) - 1;
        const newCount = prev + change;
        return newCount < 1200 ? 1200 : newCount;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check for email mode from URL
  useEffect(() => {
    if (modeParam === "email") {
      setLoginMode("email");
      setScreen("email");
    }
  }, [modeParam]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setError(null);
  };

  const requestOtp = async () => {
    setError(null);
    setOtpInfo(null);
    
    // Validate phone number
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setOtpSending(true);
    try {
      // Send phone with country code format
      const phoneWithCode = `+91${phoneDigits}`;
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneWithCode }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = data.error || "Failed to send OTP. Please try again.";
        throw new Error(errorMsg);
      }

      setOtpSent(true);
      setScreen("otp");
      setStep(2);
      setCountdown(28);
      
      // In development, show OTP for testing
      if (data.otp) {
        setOtpInfo(`OTP: ${data.otp} (for testing)`);
        console.log(`[OTP] Sent to ${phoneWithCode}: ${data.otp}`);
      }
    } catch (err) {
      console.error("OTP request error:", err);
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otpCode];
    newOtp[index] = digit;
    setOtpCode(newOtp);
    setError(null);

    // Auto-focus next box
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
      setTimeout(() => verifyOtp(), 400);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    setError(null);
    const code = otpCode.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    
    if (phone.length < 10) {
      setError("Invalid phone number");
      return;
    }

    setOtpVerifying(true);
    try {
      // Normalize phone number (remove any formatting, ensure it's just digits)
      const phoneDigits = phone.replace(/\D/g, "");
      const phoneWithCode = phoneDigits.length === 10 ? `+91${phoneDigits}` : phone.startsWith("+") ? phone : `+91${phoneDigits}`;
      
      const res = await signIn("credentials", {
        phone: phoneWithCode,
        otp: code,
        redirect: false,
      });
      
      if (res?.error) {
        console.error("Login error:", res.error);
        setError("Invalid OTP. Please check and try again.");
        setOtpCode(["", "", "", "", "", ""]);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
        return;
      }

      if (res?.ok) {
        setStep(3);
        setScreen("success");
        setTimeout(() => {
          router.push(callback);
        }, 2000);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err instanceof Error ? err.message : "Failed to verify OTP. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const goBack = () => {
    setScreen("phone");
    setStep(1);
    setOtpCode(["", "", "", "", "", ""]);
    setOtpSent(false);
    setError(null);
  };

  const handleEmailLogin = () => {
    setLoginMode("email");
    setScreen("email");
    setError(null);
  };

  const handleEmailSignIn = async () => {
    setError(null);
    
    // Validate email
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Validate password
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setEmailLoggingIn(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password: password,
        redirect: false,
      });
      
      if (res?.error) {
        console.error("Login error:", res.error);
        setError("Invalid email or password. Please try again.");
        return;
      }

      if (res?.ok) {
        setStep(3);
        setScreen("success");
        setTimeout(() => {
          router.push(callback);
        }, 2000);
      }
    } catch (err) {
      console.error("Email login error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
    } finally {
      setEmailLoggingIn(false);
    }
  };

  const switchToPhone = () => {
    setLoginMode("phone");
    setScreen("phone");
    setEmail("");
    setPassword("");
    setError(null);
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--color-primary-deep)" }}>
      <div className="grid h-screen" style={{ gridTemplateColumns: "1fr 480px" }}>
        {/* LEFT PANEL — Brand Story */}
        <div className="relative flex flex-col justify-between p-10 overflow-hidden" style={{ background: "var(--color-primary-deep)" }}>
          {/* Animated background mesh */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute rounded-full opacity-25 blur-[80px] animate-pulse"
              style={{
                width: "500px",
                height: "500px",
                background: "var(--color-primary)",
                top: "-100px",
                left: "-100px",
                animation: "drift 12s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full opacity-25 blur-[80px] animate-pulse"
              style={{
                width: "400px",
                height: "400px",
                background: "var(--color-accent)",
                bottom: "-80px",
                right: "20px",
                animation: "drift 12s ease-in-out infinite 4s",
              }}
            />
            <div
              className="absolute rounded-full opacity-25 blur-[80px] animate-pulse"
              style={{
                width: "300px",
                height: "300px",
                background: "var(--color-primary-mid)",
                top: "40%",
                left: "30%",
                animation: "drift 12s ease-in-out infinite 8s",
              }}
            />
          </div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Floating community dots */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { top: "28%", left: "22%", color: "var(--color-accent)", delay: "0s" },
              { top: "42%", left: "58%", color: "var(--color-success)", delay: "1s" },
              { top: "65%", left: "35%", color: "white", delay: "2s" },
              { top: "35%", left: "75%", color: "var(--color-accent)", delay: "0.5s" },
              { top: "72%", left: "68%", color: "white", delay: "1.5s" },
              { top: "20%", left: "50%", color: "var(--color-success)", delay: "2.5s" },
            ].map((dot, idx) => (
              <div
                key={idx}
                className="absolute rounded-full border-2 animate-pulse"
                style={{
                  width: `${8 + idx * 2}px`,
                  height: `${8 + idx * 2}px`,
                  top: dot.top,
                  left: dot.left,
                  background: dot.color,
                  borderColor: dot.color,
                  animationDelay: dot.delay,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white rounded-[10px] px-3 py-2">
                <div
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white text-sm font-extrabold"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                  }}
                >
                  R
                </div>
                <div className="text-base font-extrabold text-[var(--color-primary)] tracking-tight">REKKOMO</div>
              </div>
              <div className="w-px h-5 bg-white/20" />
              <div className="text-sm font-semibold text-white/70 tracking-wide">Apna Sheher</div>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
            {/* Hero */}
            <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80 mb-7 backdrop-blur-sm w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              India&apos;s Migrant Community Platform
            </div>

            <h1 className="font-devanagari text-5xl font-extrabold text-white leading-tight mb-1.5">
              अपना शहर<br />
              <span style={{ color: "var(--color-accent)" }}>अपने लोग</span>
            </h1>
            <p className="text-xl font-medium text-white/55 mb-8">Your City. Your People. Your Community.</p>

            {/* Stats */}
            <div className="flex gap-0 border-t border-b border-white/10">
              <div className="px-6 py-4 text-center border-r border-white/10">
                <div className="text-3xl font-extrabold text-white leading-none">
                  600<span style={{ color: "var(--color-accent)" }}>M+</span>
                </div>
                <div className="text-[11px] text-white/45 font-medium mt-1">Indian Migrants</div>
              </div>
              <div className="px-6 py-4 text-center border-r border-white/10">
                <div className="text-3xl font-extrabold text-white leading-none">
                  <span style={{ color: "var(--color-accent)" }}>28</span>
                </div>
                <div className="text-[11px] text-white/45 font-medium mt-1">State Circles</div>
              </div>
              <div className="px-6 py-4 text-center">
                <div className="text-3xl font-extrabold text-white leading-none">
                  50<span style={{ color: "var(--color-accent)" }}>+</span>
                </div>
                <div className="text-[11px] text-white/45 font-medium mt-1">Cities</div>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            {/* Social Proof */}
            <div className="bg-white/6 border border-white/12 rounded-2xl p-5 backdrop-blur-xl">
              <p className="text-sm leading-relaxed text-white/80 mb-3.5 italic">
                &quot;Apna Sheher ne mujhe Pune mein Bihar ke 200 logon se milaya. Pehle hafte hi naukri mil gayi.&quot;
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/30"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                  }}
                >
                  R
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-white">Rajan Kumar</div>
                  <div className="text-[11px] text-white/50 mt-0.5">From Patna · Now in Pune</div>
                </div>
                <div className="bg-[var(--color-success)] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  ✅ Hired
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-white/8">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"
                  style={{
                    boxShadow: "0 0 0 0 rgba(5,150,105,0.6)",
                  }}
                />
                <div className="text-xs text-white/55 font-medium">
                  <span className="text-white font-bold">{liveCount.toLocaleString()}</span> people online right now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Login Form */}
        <div className="bg-[var(--color-paper)] flex flex-col justify-center p-11 relative overflow-y-auto">
          {/* Top pattern */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{
              background: "linear-gradient(90deg, var(--color-primary-deep), var(--color-primary), var(--color-accent))",
            }}
          />

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-10">
            <div
              className={`h-2 rounded-full transition-all ${
                step >= 1 ? "w-6 bg-[var(--color-primary)]" : "w-2 bg-[var(--color-fog)]"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                step >= 2 ? "w-6 bg-[var(--color-primary)]" : "w-2 bg-[var(--color-fog)]"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                step >= 3 ? "w-6 bg-[var(--color-success)]" : "w-2 bg-[var(--color-fog)]"
              }`}
            />
            <span className="text-xs font-semibold text-[var(--color-mist)] ml-1">
              {step === 1 && "Enter your phone"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Welcome!"}
            </span>
          </div>

          {/* EMAIL SCREEN */}
          {screen === "email" && (
            <div className="animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-3xl font-extrabold text-[var(--color-ink)] leading-tight mb-1.5 tracking-tight">
                Welcome back 👋<br />
                Sign in with email
              </h2>
              <p className="text-sm text-[var(--color-slate)] mb-9 leading-relaxed">
                Enter your email and password to continue.
              </p>

              {/* Language Toggle */}
              <div className="flex items-center gap-2 mb-7">
                <span className="text-xs text-[var(--color-mist)] font-medium">Language:</span>
                <div className="flex bg-[var(--color-cloud)] rounded-lg p-0.5 gap-0.5">
                  {[
                    { code: "en", label: "English" },
                    { code: "hi", label: "हिंदी" },
                    { code: "bn", label: "বাংলা" },
                    { code: "od", label: "ଓଡ଼ିଆ" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code as any)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        language === lang.code
                          ? "bg-white text-[var(--color-primary)] shadow-sm"
                          : "text-[var(--color-slate)]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Input */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--color-ink)] tracking-wide">Email Address</label>
                  <span className="text-xs text-[var(--color-mist)] font-medium">Required</span>
                </div>
                <div
                  className={`flex bg-white border-2 rounded-xl overflow-hidden transition-all ${
                    email.length > 0 && email.includes("@")
                      ? "border-[var(--color-primary)]"
                      : error && screen === "email"
                      ? "border-[var(--color-danger)]"
                      : "border-[var(--color-fog)]"
                  }`}
                  style={{
                    boxShadow: email.length > 0 && email.includes("@") ? "0 0 0 4px rgba(43,79,212,0.1)" : "0 1px 3px rgba(43,79,212,0.04)",
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="your.email@example.com"
                    className="flex-1 border-none outline-none px-4 py-3.5 text-base font-semibold text-[var(--color-ink)] bg-transparent"
                    style={{ fontFamily: "var(--font-primary)" }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--color-ink)] tracking-wide">Password</label>
                  <span className="text-xs text-[var(--color-mist)] font-medium">Required</span>
                </div>
                <div
                  className={`flex bg-white border-2 rounded-xl overflow-hidden transition-all ${
                    password.length > 0
                      ? "border-[var(--color-primary)]"
                      : error && screen === "email"
                      ? "border-[var(--color-danger)]"
                      : "border-[var(--color-fog)]"
                  }`}
                  style={{
                    boxShadow: password.length > 0 ? "0 0 0 4px rgba(43,79,212,0.1)" : "0 1px 3px rgba(43,79,212,0.04)",
                  }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter your password"
                    className="flex-1 border-none outline-none px-4 py-3.5 text-base font-semibold text-[var(--color-ink)] bg-transparent"
                    style={{ fontFamily: "var(--font-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-4 text-[var(--color-mist)] hover:text-[var(--color-ink)] transition-colors"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {error && screen === "email" && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--color-danger)] font-semibold">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleEmailSignIn}
                disabled={emailLoggingIn || !email || !password || password.length < 8}
                className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 mb-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                  boxShadow: "0 4px 16px rgba(43,79,212,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!emailLoggingIn) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(43,79,212,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(43,79,212,0.3)";
                }}
              >
                {emailLoggingIn ? (
                  <>
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="text-lg">🔐</span>
                    Sign In
                  </>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center mb-8">
                <button
                  className="text-xs text-[var(--color-primary)] font-semibold hover:underline"
                  onClick={() => {
                    // TODO: Implement forgot password
                    alert("Forgot password feature coming soon!");
                  }}
                >
                  Forgot your password?
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[var(--color-fog)]" />
                <div className="text-[11px] text-[var(--color-mist)] font-semibold whitespace-nowrap">or continue with</div>
                <div className="flex-1 h-px bg-[var(--color-fog)]" />
              </div>

              {/* Alternative Login */}
              <div className="flex gap-2.5 mb-8">
                <button
                  onClick={switchToPhone}
                  className="flex-1 py-3 bg-white border-2 border-[var(--color-fog)] rounded-[10px] text-[13px] font-semibold text-[var(--color-slate)] flex items-center justify-center gap-2 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                >
                  <span className="text-base">📱</span>
                  Phone / OTP
                </button>
                <button className="flex-1 py-3 bg-white border-2 border-[var(--color-fog)] rounded-[10px] text-[13px] font-semibold text-[var(--color-slate)] flex items-center justify-center gap-2 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]">
                  <span className="text-base">🔗</span>
                  Google
                </button>
              </div>
            </div>
          )}

          {/* PHONE SCREEN */}
          {screen === "phone" && (
            <div className="animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-3xl font-extrabold text-[var(--color-ink)] leading-tight mb-1.5 tracking-tight">
                Welcome back 👋<br />
                or join free today
              </h2>
              <p className="text-sm text-[var(--color-slate)] mb-9 leading-relaxed">
                Enter your mobile number to get started. No password needed — ever.
              </p>

              {/* Language Toggle */}
              <div className="flex items-center gap-2 mb-7">
                <span className="text-xs text-[var(--color-mist)] font-medium">Language:</span>
                <div className="flex bg-[var(--color-cloud)] rounded-lg p-0.5 gap-0.5">
                  {[
                    { code: "en", label: "English" },
                    { code: "hi", label: "हिंदी" },
                    { code: "bn", label: "বাংলা" },
                    { code: "od", label: "ଓଡ଼ିଆ" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code as any)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        language === lang.code
                          ? "bg-white text-[var(--color-primary)] shadow-sm"
                          : "text-[var(--color-slate)]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Input */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--color-ink)] tracking-wide">Mobile Number</label>
                  <span className="text-xs text-[var(--color-mist)] font-medium">Required</span>
                </div>
                <div
                  className={`flex bg-white border-2 rounded-xl overflow-hidden transition-all ${
                    phone.length > 0
                      ? "border-[var(--color-primary)]"
                      : error
                      ? "border-[var(--color-danger)]"
                      : "border-[var(--color-fog)]"
                  }`}
                  style={{
                    boxShadow: phone.length > 0 ? "0 0 0 4px rgba(43,79,212,0.1)" : "0 1px 3px rgba(43,79,212,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 px-3.5 py-3.5 border-r-2 border-[var(--color-fog)] bg-[var(--color-cloud)] cursor-pointer hover:bg-[var(--color-primary-light)] transition-colors">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-sm font-bold text-[var(--color-ink)]">+91</span>
                    <span className="text-[10px] text-[var(--color-mist)]">▾</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="flex-1 border-none outline-none px-4 py-3.5 text-base font-semibold text-[var(--color-ink)] tracking-wider bg-transparent"
                    style={{ fontFamily: "var(--font-primary)" }}
                  />
                </div>
                {error && screen === "phone" && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--color-danger)] font-semibold">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* State Selector */}
              <div className="mb-6">
                <div className="text-[13px] text-[var(--color-slate)] mb-3">
                  Which state are you from?{" "}
                  <span className="text-[var(--color-mist)]">(optional — helps us find your community)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["🌾 Bihar", "🏛️ UP", "🌊 Odisha", "🐯 Bengal", "🏜️ Rajasthan", "🌿 Jharkhand"].map((state) => (
                    <button
                      key={state}
                      onClick={() => setSelectedState(state)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedState === state
                          ? "bg-[var(--color-primary)] text-white border-2 border-[var(--color-primary)]"
                          : "bg-white text-[var(--color-slate)] border-2 border-[var(--color-fog)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                  <button className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-cloud)] text-[var(--color-slate)] border-2 border-[var(--color-fog)]">
                    + More
                  </button>
                </div>
              </div>

              {/* Send OTP Button */}
              <button
                onClick={requestOtp}
                disabled={otpSending || phone.length < 10}
                className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 mb-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                  boxShadow: "0 4px 16px rgba(43,79,212,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!otpSending) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(43,79,212,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(43,79,212,0.3)";
                }}
              >
                {otpSending ? (
                  <>
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <span className="text-lg">📱</span>
                    Send OTP — It&apos;s Free
                  </>
                )}
              </button>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-5 mb-8">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-mist)] font-medium">
                  <span className="text-[13px]">🔒</span> No password ever
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-mist)] font-medium">
                  <span className="text-[13px]">🆓</span> Always free to join
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-mist)] font-medium">
                  <span className="text-[13px]">🛡️</span> Your data is safe
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[var(--color-fog)]" />
                <div className="text-[11px] text-[var(--color-mist)] font-semibold whitespace-nowrap">or continue with</div>
                <div className="flex-1 h-px bg-[var(--color-fog)]" />
              </div>

              {/* Alternative Login */}
              <div className="flex gap-2.5 mb-8">
                <button
                  onClick={handleEmailLogin}
                  className="flex-1 py-3 bg-white border-2 border-[var(--color-fog)] rounded-[10px] text-[13px] font-semibold text-[var(--color-slate)] flex items-center justify-center gap-2 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                >
                  <span className="text-base">📧</span>
                  Email
                </button>
                <button
                  onClick={() => signIn("google", { callbackUrl: callback })}
                  className="flex-1 py-3 bg-white border-2 border-[var(--color-fog)] rounded-[10px] text-[13px] font-semibold text-[var(--color-slate)] flex items-center justify-center gap-2 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                >
                  <span className="text-base">🔗</span>
                  Google
                </button>
              </div>
            </div>
          )}

          {/* OTP SCREEN */}
          {screen === "otp" && (
            <div className="animate-in fade-in slide-in-from-right-6 duration-500">
              <h2 className="text-3xl font-extrabold text-[var(--color-ink)] leading-tight mb-1.5 tracking-tight">
                Check your phone ✉️
              </h2>
              <p className="text-sm text-[var(--color-slate)] mb-7 leading-relaxed">
                We sent a 6-digit code to your number. It expires in 10 minutes.
              </p>

              {/* OTP Sent Info */}
              <div className="flex items-center gap-3 bg-[var(--color-success-light)] border border-[var(--color-success)]/20 rounded-xl p-3.5 mb-7">
                <div className="text-xl">📱</div>
                <div>
                  <div className="text-[13px] text-[var(--color-success)] font-semibold">OTP sent to</div>
                  <div className="text-[13px] text-[var(--color-ink)] font-bold">
                    +91 {phone.slice(0, 5)} {phone.slice(5)}
                  </div>
                </div>
              </div>

              {/* OTP Boxes */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-[var(--color-ink)] mb-3">Enter 6-digit OTP</label>
                <div className="flex gap-2.5">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="tel"
                      maxLength={1}
                      value={otpCode[index]}
                      onChange={(e) => handleOtpInput(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`flex-1 aspect-square max-w-[56px] bg-white border-2 rounded-xl text-2xl font-extrabold text-[var(--color-ink)] text-center outline-none transition-all ${
                        otpCode[index]
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                          : error
                          ? "border-[var(--color-danger)] bg-[#FEF2F2]"
                          : "border-[var(--color-fog)]"
                      }`}
                      style={{
                        boxShadow: otpCode[index] ? "0 0 0 4px rgba(43,79,212,0.12)" : "0 1px 3px rgba(43,79,212,0.04)",
                      }}
                    />
                  ))}
                </div>
                {error && screen === "otp" && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--color-danger)] font-semibold">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* OTP Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-[13px] text-[var(--color-mist)] font-medium">
                  Resend in{" "}
                  <span className="font-bold text-[var(--color-primary)]">
                    {countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}` : "Resend now"}
                  </span>
                </div>
                <button
                  onClick={goBack}
                  className="text-[13px] text-[var(--color-primary)] font-semibold underline underline-offset-2 cursor-pointer"
                >
                  ← Change number
                </button>
              </div>

              {/* Verify Button */}
              <button
                onClick={verifyOtp}
                disabled={otpVerifying || otpCode.join("").length < 6}
                className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 mb-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, var(--color-success) 0%, #047857 100%)",
                  boxShadow: "0 4px 16px rgba(5,150,105,0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!otpVerifying) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(5,150,105,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(5,150,105,0.3)";
                }}
              >
                {otpVerifying ? (
                  <>
                    <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    Verify & Enter Apna Sheher
                  </>
                )}
              </button>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-5 mb-8">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-mist)] font-medium">
                  <span className="text-[13px]">🔐</span> 256-bit encrypted
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-mist)] font-medium">
                  <span className="text-[13px]">⏱️</span> Expires in 10 min
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-mist)] font-medium">
                  <span className="text-[13px]">🆓</span> Free forever
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {screen === "success" && (
            <div className="flex flex-col items-center justify-center min-h-[300px] animate-in fade-in zoom-in-95 duration-500">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 animate-in zoom-in duration-500"
                style={{ background: "var(--color-success-light)" }}
              >
                🎉
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--color-ink)] mb-2">You&apos;re in!</h2>
              <p className="text-sm text-[var(--color-slate)] mb-7 text-center leading-relaxed">
                Welcome to Apna Sheher.
                <br />
                Your Bihar Circle in Pune is waiting — <strong>4,218 members</strong> are already here.
              </p>
              <div className="flex items-center gap-2.5 text-[13px] text-[var(--color-mist)]">
                <span>Taking you to your community</span>
                <div className="w-30 h-1 bg-[var(--color-fog)] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-sm animate-[fill-bar_3s_linear_forwards]"
                    style={{ width: "0%" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-7 text-center text-xs text-[var(--color-mist)] leading-relaxed">
            By continuing, you agree to REKKOMO&apos;s{" "}
            <a href="/terms" className="text-[var(--color-primary)] font-semibold no-underline hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-[var(--color-primary)] font-semibold no-underline hover:underline">
              Privacy Policy
            </a>
            .<br />
            Your phone number will never be shared without your permission.
          </div>

          {/* Bottom Brand */}
          <div className="mt-7 pt-5 border-t border-[var(--color-fog)] flex items-center justify-center gap-2">
            <div className="text-[11px] text-[var(--color-mist)] font-medium">A product by</div>
            <div className="text-xs font-extrabold text-[var(--color-primary)] tracking-wide">REKKOMO</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes fill-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

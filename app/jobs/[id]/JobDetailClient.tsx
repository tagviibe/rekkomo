"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type JobDetailClientProps = {
  job: any;
  userApplication: any;
  isAuthenticated: boolean;
  similarJobs: any[];
};

export default function JobDetailClient({
  job,
  userApplication,
  isAuthenticated,
  similarJobs,
}: JobDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(!!userApplication);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    experience: "",
    skills: [] as string[],
    message: "",
  });

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push("/auth/signin?callback=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience: applyForm.experience,
          skills: applyForm.skills,
          message: applyForm.message,
        }),
      });

      if (res.ok) {
        setApplied(true);
        setShowApplyModal(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to apply");
      }
    } catch (error) {
      console.error("Failed to apply:", error);
      alert("Failed to apply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const employer = job.employer || {};
  const initials = (employer.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const getStateEmoji = (state: string) => {
    switch (state) {
      case "Odisha": return "🌊";
      case "Uttar Pradesh": return "🏛️";
      case "Odisha": return "🌊";
      case "West Bengal": return "🐯";
      case "Rajasthan": return "🏜️";
      default: return "📍";
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  };

  const toggleSkill = (skill: string) => {
    setApplyForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const availableSkills = [
    "Machine Operation",
    "Quality Checking",
    "Packaging",
    "Basic Maintenance",
    "Forklift",
    "Production",
    "Assembly",
  ];

  const applicationsCount = job._count?.applications || job.applications?.length || 0;
  const remainingOpenings = job.numberOfOpenings - applicationsCount;
  const deadlineDate = job.deadline ? new Date(job.deadline) : null;
  const daysUntilDeadline = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div className="min-h-screen" style={{ background: "var(--paper)" }}>
        {/* Navbar with breadcrumb */}
        <div
          className="sticky top-0 z-50 border-b px-4 sm:px-6 md:px-8"
          style={{
            background: "rgba(247,243,238,0.97)",
            backdropFilter: "blur(16px)",
            borderColor: "var(--border)",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className="flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--blue), var(--blue-mid))",
                borderRadius: "9px",
                padding: "6px 10px",
                fontSize: "13px",
                fontWeight: 800,
                color: "white",
              }}
            >
              R
            </div>
            <div className="hidden xs:block text-sm sm:text-base font-extrabold" style={{ color: "var(--ink)" }}>
              REKKOMO
            </div>
            <div className="hidden sm:block" style={{ width: "1px", height: "18px", background: "var(--border)" }} />
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0" style={{ color: "var(--muted)" }}>
              <Link href="/jobs" className="truncate" style={{ color: "var(--muted)", textDecoration: "none" }}>
                Jobs
              </Link>
              <span style={{ color: "var(--border)" }}>›</span>
              <span className="truncate" style={{ color: "var(--ink)", fontWeight: 700 }}>{job.skillCategory}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push("/jobs")}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-xs sm:text-sm font-semibold min-h-11 whitespace-nowrap"
              style={{
                borderColor: "var(--border)",
                background: "white",
                color: "var(--muted)",
                cursor: "pointer",
                fontFamily: "var(--font-primary)",
              }}
            >
              <span className="hidden sm:inline">← Back to Jobs</span>
              <span className="sm:hidden">← Back</span>
            </button>
          </div>
        </div>

        <div
          className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-12"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <style jsx>{`
            @media (min-width: 1024px) {
              .job-detail-grid {
                grid-template-columns: 1fr 360px !important;
                gap: 28px !important;
              }
            }
          `}</style>
          <div className="job-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          {/* LEFT COLUMN */}
          <div>
            {/* Job Hero */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                boxShadow: "var(--shadow-md)",
                marginBottom: "20px",
              }}
            >
              {/* Banner */}
              <div
                className="h-32 sm:h-36 md:h-[156px] relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--blue-mid), var(--blue) 55%, var(--blue))",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: "radial-gradient(circle at 15% 50%, rgba(255,255,255,.07), transparent 55%), radial-gradient(circle at 85% 20%, rgba(255,255,255,.05), transparent 45%)",
                  }}
                />
                <div
                  className="absolute top-3 sm:top-4 left-3 sm:left-4 md:left-5 px-2 sm:px-3 md:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-xs md:text-[11px] font-bold flex items-center gap-1 sm:gap-1.5 md:gap-2"
                  style={{
                    background: "rgba(255,255,255,.15)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,.2)",
                    color: "white",
                  }}
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">{job.skillCategory}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline truncate">{job.location.split(",")[0]}</span>
                </div>
                {job.status === "OPEN" && (
                  <div
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 md:right-5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-xs md:text-[11px] font-extrabold whitespace-nowrap"
                    style={{
                      background: "var(--gold)",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(201,146,10,.4)",
                    }}
                  >
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 md:p-7 relative">
                {/* Logo */}
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-[60px] md:h-[60px] rounded-xl md:rounded-[14px] flex items-center justify-center text-xl sm:text-2xl md:text-[26px] absolute -top-6 left-4 sm:left-6 md:left-7"
                  style={{
                    background: "var(--blue-light)",
                    border: "3px solid white",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {job.skillCategory === "Manufacturing" ? "🏭" : "💼"}
                </div>

                <div className="pt-8 sm:pt-10 md:pt-[38px] mb-4 sm:mb-6">
                  <h1
                    className="text-lg sm:text-xl md:text-2xl font-extrabold mb-2 sm:mb-3"
                    style={{
                      color: "var(--ink)",
                      letterSpacing: "-0.4px",
                    }}
                  >
                    {job.title}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--muted)" }}>
                      {employer.name || "Employer"}
                    </div>
                    {employer.profile?.trustScore && employer.profile.trustScore >= 100 && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          borderRadius: "100px",
                          padding: "3px 9px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: "var(--green-light)",
                          color: "var(--green)",
                        }}
                      >
                        ✅ Verified Employer
                      </div>
                    )}
                    {job.statePref && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          borderRadius: "100px",
                          padding: "3px 9px",
                          fontSize: "10px",
                          fontWeight: 700,
                          background: "var(--gold-light)",
                          color: "var(--gold)",
                          border: "1px solid rgba(201,146,10,0.2)",
                        }}
                      >
                        {getStateEmoji(job.statePref)} Prefers {job.statePref} Workers
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "auto" }}>
                      Posted {getTimeAgo(job.createdAt)} · {applicationsCount} applicants
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6"
                >
                  <div
                    className="rounded-lg sm:rounded-[10px] p-2 sm:p-3"
                    style={{
                      background: "var(--blue-light)",
                      border: "1px solid rgba(27,79,138,.07)",
                    }}
                  >
                    <div
                      className="text-[8px] sm:text-[9px] font-extrabold uppercase mb-1 sm:mb-2"
                      style={{
                        color: "var(--blue)",
                        letterSpacing: ".12em",
                      }}
                    >
                      Monthly Pay
                    </div>
                    <div
                      className="text-base sm:text-lg md:text-xl font-extrabold"
                      style={{
                        color: "var(--green)",
                      }}
                    >
                      ₹{job.payMin?.toLocaleString() || "N/A"}
                      {job.payMax && ` - ₹${job.payMax.toLocaleString()}`}
                    </div>
                    <div className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1" style={{ color: "var(--muted)" }}>
                      + overtime pay
                    </div>
                  </div>
                  <div
                    className="rounded-lg sm:rounded-[10px] p-2 sm:p-3"
                    style={{
                      background: "var(--blue-light)",
                      border: "1px solid rgba(27,79,138,.07)",
                    }}
                  >
                    <div
                      className="text-[8px] sm:text-[9px] font-extrabold uppercase mb-1 sm:mb-2"
                      style={{
                        color: "var(--blue)",
                        letterSpacing: ".12em",
                      }}
                    >
                      Location
                    </div>
                    <div className="text-sm sm:text-base md:text-base font-extrabold" style={{ color: "var(--ink)" }}>
                      {job.location.split(",")[0]}
                    </div>
                    <div className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1" style={{ color: "var(--muted)" }}>
                      {job.location.split(",").slice(1).join(",").trim() || "Location"}
                    </div>
                  </div>
                  <div
                    className="rounded-lg sm:rounded-[10px] p-2 sm:p-3"
                    style={{
                      background: "var(--blue-light)",
                      border: "1px solid rgba(27,79,138,.07)",
                    }}
                  >
                    <div
                      className="text-[8px] sm:text-[9px] font-extrabold uppercase mb-1 sm:mb-2"
                      style={{
                        color: "var(--blue)",
                        letterSpacing: ".12em",
                      }}
                    >
                      Job Type
                    </div>
                    <div className="text-sm sm:text-base md:text-base font-extrabold" style={{ color: "var(--ink)" }}>
                      Full-time
                    </div>
                    <div className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1" style={{ color: "var(--muted)" }}>
                      Permanent
                    </div>
                  </div>
                  <div
                    className="rounded-lg sm:rounded-[10px] p-2 sm:p-3"
                    style={{
                      background: "var(--blue-light)",
                      border: "1px solid rgba(27,79,138,.07)",
                    }}
                  >
                    <div
                      className="text-[8px] sm:text-[9px] font-extrabold uppercase mb-1 sm:mb-2"
                      style={{
                        color: "var(--blue)",
                        letterSpacing: ".12em",
                      }}
                    >
                      Openings
                    </div>
                    <div className="text-sm sm:text-base md:text-base font-extrabold" style={{ color: "var(--ink)" }}>
                      {remainingOpenings > 0 ? `${remainingOpenings} left` : "Filled"}
                    </div>
                    <div className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1" style={{ color: "var(--muted)" }}>
                      of {job.numberOfOpenings} total
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "7px",
                    marginBottom: "18px",
                  }}
                >
                  {job.description?.toLowerCase().includes("housing") && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "var(--green-light)",
                        color: "var(--green)",
                        border: "1px solid rgba(27,107,69,.12)",
                      }}
                    >
                      🏠 Housing
                    </div>
                  )}
                  {job.description?.toLowerCase().includes("meal") && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "var(--green-light)",
                        color: "var(--green)",
                        border: "1px solid rgba(27,107,69,.12)",
                      }}
                    >
                      🍱 Free Meals
                    </div>
                  )}
                  {job.description?.toLowerCase().includes("transport") && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "100px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "var(--green-light)",
                        color: "var(--green)",
                        border: "1px solid rgba(27,107,69,.12)",
                      }}
                    >
                      🚌 Transport
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "var(--green-light)",
                      color: "var(--green)",
                      border: "1px solid rgba(27,107,69,.12)",
                    }}
                  >
                    ⏰ Overtime Pay
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "var(--green-light)",
                      color: "var(--green)",
                      border: "1px solid rgba(27,107,69,.12)",
                    }}
                  >
                    💳 PF / ESI
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "var(--green-light)",
                      color: "var(--green)",
                      border: "1px solid rgba(27,107,69,.12)",
                    }}
                  >
                    📅 Weekly Off
                  </div>
                </div>

                {/* Community Reach */}
                {job.statePref && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "linear-gradient(135deg, var(--gold-light), #FEF3C7)",
                      border: "1.5px solid rgba(201,146,10,.28)",
                      borderRadius: "10px",
                      padding: "11px 13px",
                      marginBottom: "18px",
                    }}
                  >
                    <div style={{ fontSize: "20px" }}>{getStateEmoji(job.statePref)}</div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--gold)",
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      This employer recruits from <strong>{job.statePref} Circle</strong>. Community members get priority callback within 24 hours.
                    </div>
                    <div
                      style={{
                        background: "var(--gold)",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "3px 9px",
                        borderRadius: "100px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Community Employer
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={applied || job.status !== "OPEN"}
                    style={{
                      flex: 1,
                      padding: "13px 18px",
                      borderRadius: "12px",
                      background: applied
                        ? "linear-gradient(135deg, var(--green), var(--green-dark))"
                        : "linear-gradient(135deg, var(--blue), var(--blue-mid))",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 800,
                      border: "none",
                      cursor: applied || job.status !== "OPEN" ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-primary)",
                      boxShadow: "0 4px 14px rgba(27,79,138,.28)",
                      transition: "all .2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      opacity: applied || job.status !== "OPEN" ? 0.7 : 1,
                    }}
                  >
                    {applied ? "✅ Application Sent" : "📝 Apply Now — Free"}
                  </button>
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "11px",
                      border: "1.5px solid var(--border)",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                    title="Save"
                  >
                    🔖
                  </div>
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "11px",
                      border: "1.5px solid var(--border)",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      cursor: "pointer",
                      transition: "all .15s",
                    }}
                    title="Share"
                  >
                    🔗
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div
              className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm"
              style={{
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>📋</span> About This Job
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  lineHeight: 1.75,
                  marginBottom: "10px",
                }}
              >
                {job.description || "No description provided."}
              </div>
            </div>

            {/* Requirements Section */}
            <div
              className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm"
              style={{
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>📌</span> Requirements
              </div>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 md:gap-3 mb-4 sm:mb-5 md:mb-6"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "9px",
                    padding: "11px 13px",
                    background: "var(--cream)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }}>🎓</div>
                  <div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginBottom: "2px",
                      }}
                    >
                      Education
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      Class 10 pass (preferred)
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "9px",
                    padding: "11px 13px",
                    background: "var(--cream)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }}>📅</div>
                  <div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginBottom: "2px",
                      }}
                    >
                      Experience
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      1–3 years preferred
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "9px",
                    padding: "11px 13px",
                    background: "var(--cream)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }}>👤</div>
                  <div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginBottom: "2px",
                      }}
                    >
                      Gender
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      Male / Female
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "9px",
                    padding: "11px 13px",
                    background: "var(--cream)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "17px", flexShrink: 0, marginTop: "1px" }}>🎂</div>
                  <div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginBottom: "2px",
                      }}
                    >
                      Age Range
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                      18 – 45 years
                    </div>
                  </div>
                </div>
              </div>
              {job.languagePref && job.languagePref.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                      marginBottom: "8px",
                    }}
                  >
                    Languages Accepted
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                    {job.languagePref.map((lang: string) => (
                      <div
                        key={lang}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "100px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: "var(--gold-light)",
                          color: "var(--gold)",
                          border: "1px solid rgba(201,146,10,.15)",
                        }}
                      >
                        🗣️ {lang}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hiring Process */}
            <div
              className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm"
              style={{
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>🔄</span> Hiring Process
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "13px",
                    paddingBottom: "16px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      border: "2px solid var(--green)",
                      background: "var(--green-light)",
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", paddingTop: "4px" }}>
                      Apply on Platform
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      Takes less than 2 minutes. No documents needed initially.
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "13px",
                    paddingBottom: "16px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "28px",
                      width: "2px",
                      bottom: 0,
                      background: "var(--green)",
                    }}
                  />
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      border: "2px solid var(--blue)",
                      background: "var(--blue-light)",
                      boxShadow: "0 0 0 4px rgba(27,79,138,.1)",
                    }}
                  >
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--blue)", paddingTop: "4px" }}>
                      Employer Reviews — within 24 hrs
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      {employer.name || "Employer"} checks your profile and application
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "13px",
                    paddingBottom: "16px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "28px",
                      width: "2px",
                      bottom: 0,
                      background: "var(--border)",
                    }}
                  />
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      border: "2px solid var(--border)",
                      background: "white",
                    }}
                  >
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", paddingTop: "4px" }}>
                      Phone / WhatsApp Interview
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      Quick 10-minute call in {job.languagePref?.[0] || "Hindi"}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "13px",
                    paddingBottom: "16px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "28px",
                      width: "2px",
                      bottom: 0,
                      background: "var(--border)",
                    }}
                  />
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      border: "2px solid var(--border)",
                      background: "white",
                    }}
                  >
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", paddingTop: "4px" }}>
                      Walk-in at {job.location.split(",")[0]}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      Come to site. Bring Aadhaar + passport photo.
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "13px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      border: "2px solid var(--border)",
                      background: "white",
                    }}
                  >
                    🎉
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", paddingTop: "4px" }}>
                      Start Work!
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      Join within 7 days of selection. Housing from Day 1.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div
              className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm"
              style={{
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>📍</span> Work Location
              </div>
              <div
                style={{
                  height: "155px",
                  background: "linear-gradient(135deg, var(--blue-light), var(--cream))",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  cursor: "pointer",
                  transition: "all .15s",
                  marginBottom: "11px",
                  position: "relative",
                  overflow: "hidden",
                }}
                onClick={() => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`;
                  window.open(mapsUrl, "_blank");
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "linear-gradient(rgba(27,79,138,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,138,.04) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <div
                  style={{
                    fontSize: "32px",
                    position: "relative",
                    zIndex: 1,
                    filter: "drop-shadow(0 3px 6px rgba(27,79,138,.2))",
                  }}
                >
                  📍
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--blue)",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {job.location}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--muted)",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  Click to open in Google Maps
                </div>
              </div>
              <button
                onClick={() => {
                  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`;
                  window.open(mapsUrl, "_blank");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(27,79,138,.2)",
                  background: "var(--blue-light)",
                  color: "var(--blue)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-primary)",
                  width: "100%",
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--blue)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--blue-light)";
                  e.currentTarget.style.color = "var(--blue)";
                }}
              >
                🗺️ Get Directions to {job.location.split(",")[0]}
              </button>
            </div>

            {/* Community Applicants */}
            {job.applications && job.applications.length > 0 && (
              <div
                className="bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm"
                style={{
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "var(--ink)",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>👥</span> Community Members Also Applied
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "13px" }}>
                  These {job.statePref || "community"} members have applied for this job
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {job.applications.slice(0, 3).map((app: any) => {
                    const seeker = app.seeker || {};
                    const seekerInitials = (seeker.name || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={app.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "11px",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 700,
                            flexShrink: 0,
                            background: "linear-gradient(135deg, var(--blue-mid), var(--blue))",
                          }}
                        >
                          {seekerInitials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {seeker.name || "Anonymous"}{" "}
                            {seeker.profile?.nativePlaceState && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  borderRadius: "100px",
                                  padding: "3px 9px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  background: "var(--blue-light)",
                                  color: "var(--blue)",
                                  marginLeft: "5px",
                                }}
                              >
                                {getStateEmoji(seeker.profile.nativePlaceState)} {seeker.profile.nativePlaceState}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                            {seeker.profile?.profession || "Job Seeker"} · Applied {getTimeAgo(app.appliedAt)}
                          </div>
                        </div>
                        <button
                          style={{
                            marginLeft: "auto",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            border: "1.5px solid var(--border)",
                            background: "white",
                            color: "var(--muted)",
                            cursor: "pointer",
                            fontFamily: "var(--font-primary)",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--blue)";
                            e.currentTarget.style.color = "var(--blue)";
                            e.currentTarget.style.background = "var(--blue-light)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--muted)";
                            e.currentTarget.style.background = "white";
                          }}
                        >
                          + Connect
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                padding: "22px 24px",
                marginBottom: "16px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>🏷️</span> Tags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                <div
                  style={{
                    padding: "5px 12px",
                    borderRadius: "100px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "var(--blue-light)",
                    color: "var(--blue)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {job.skillCategory}
                </div>
                {job.statePref && (
                  <div
                    style={{
                      padding: "5px 12px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "var(--gold-light)",
                      color: "var(--gold)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {job.statePref} Workers
                  </div>
                )}
                {job.description?.toLowerCase().includes("housing") && (
                  <div
                    style={{
                      padding: "5px 12px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "var(--green-light)",
                      color: "var(--green)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Housing Included
                  </div>
                )}
                {job.description?.toLowerCase().includes("meal") && (
                  <div
                    style={{
                      padding: "5px 12px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "var(--green-light)",
                      color: "var(--green)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Meals Provided
                  </div>
                )}
                {job.statePref && (
                  <div
                    style={{
                      padding: "5px 12px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: "var(--blue)",
                      color: "white",
                      border: "1px solid var(--blue)",
                    }}
                  >
                    Community Employer
                  </div>
                )}
                <div
                  style={{
                    padding: "5px 12px",
                    borderRadius: "100px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "var(--cream)",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Full-time
                </div>
                <div
                  style={{
                    padding: "5px 12px",
                    borderRadius: "100px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "var(--cream)",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {job.location.split(",")[0]}
                </div>
              </div>
            </div>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  padding: "22px 24px",
                  marginBottom: "16px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "var(--ink)",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>🔍</span> Similar Jobs Near You
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {similarJobs.map((similarJob) => (
                    <Link
                      key={similarJob.id}
                      href={`/jobs/${similarJob.id}`}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        cursor: "pointer",
                        transition: "all .15s",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "11px",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--blue)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "var(--blue-light)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      >
                        🔧
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--ink)",
                            marginBottom: "2px",
                          }}
                        >
                          {similarJob.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {similarJob.employer?.name || "Employer"} · {similarJob.location}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "var(--green)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₹{similarJob.payMin?.toLocaleString() || "N/A"}/mo
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden lg:flex flex-col gap-4 lg:gap-4" style={{ position: "sticky", top: "118px" }}>
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                padding: "20px 22px",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "3px",
                }}
              >
                {job.title}
              </div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--green)",
                  letterSpacing: "-0.4px",
                  marginBottom: "2px",
                }}
              >
                ₹{job.payMin?.toLocaleString() || "N/A"}{" "}
                <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 400 }}>/month</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "14px" }}>
                + overtime · Housing & meals included
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: "10px",
                    padding: "9px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                    {applicationsCount}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600, marginTop: "1px" }}>
                    Applicants
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: "10px",
                    padding: "9px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                    {remainingOpenings}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600, marginTop: "1px" }}>
                    Openings left
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: "10px",
                    padding: "9px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>24h</div>
                  <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600, marginTop: "1px" }}>
                    Avg. response
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: "10px",
                    padding: "9px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>89%</div>
                  <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600, marginTop: "1px" }}>
                    Hire rate
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                disabled={applied || job.status !== "OPEN"}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: applied || job.status !== "OPEN" ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "9px",
                  transition: "all .2s",
                  background: applied
                    ? "linear-gradient(135deg, var(--green), var(--green-dark))"
                    : "linear-gradient(135deg, var(--blue), var(--blue-mid))",
                  color: "white",
                  boxShadow: "0 4px 14px rgba(27,79,138,.28)",
                  opacity: applied || job.status !== "OPEN" ? 0.7 : 1,
                }}
              >
                {applied ? "✅ Application Sent" : "📝 Apply Now — Free"}
              </button>
              {deadlineDate && daysUntilDeadline && daysUntilDeadline > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--color-danger)",
                    fontWeight: 700,
                    marginTop: "11px",
                    padding: "8px 10px",
                    background: "var(--color-danger-light)",
                    borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,.15)",
                  }}
                >
                  ⏰ Closes in {daysUntilDeadline} day{daysUntilDeadline > 1 ? "s" : ""} — {deadlineDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              )}
            </div>

            {/* Employer Card */}
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                padding: "20px 22px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "13px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "var(--blue-light)",
                    border: "1px solid rgba(27,79,138,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {job.skillCategory === "Manufacturing" ? "🏭" : "💼"}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
                    {employer.name || "Employer"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                    {employer.profile?.profession || "Employer"} · {job.location.split(",")[0]}
                  </div>
                </div>
              </div>
              <Link
                href={`/profile/${employer.id}`}
                style={{
                  width: "100%",
                  padding: "9px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--border)",
                  background: "white",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-primary)",
                  transition: "all .15s",
                  display: "block",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                View Employer Profile →
              </Link>
            </div>

            {/* Trust Card */}
            <div
              style={{
                borderRadius: "14px",
                padding: "16px 18px",
                background: "var(--blue-light)",
                border: "1px solid rgba(27,79,138,.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ fontSize: "20px" }}>🛡️</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--blue)" }}>
                  Why This Job Is Safe
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  Employer identity verified with GST + Aadhaar
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  {applicationsCount} workers applied — all community-reviewed
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  Pay disputes resolved in 48 hrs through platform
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  Housing & meals verified by on-site inspection
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                      flexShrink: 0,
                    }}
                  />
                  Phone revealed only after mutual consent
                </div>
              </div>
            </div>

            {/* Share Card */}
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                padding: "16px 18px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "10px",
                }}
              >
                📤 Share this job
              </div>
              <div style={{ display: "flex", gap: "7px" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px 5px",
                    borderRadius: "9px",
                    border: "1.5px solid var(--border)",
                    background: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontFamily: "var(--font-primary)",
                    textAlign: "center",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.color = "var(--blue)";
                    e.currentTarget.style.background = "var(--blue-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 5px",
                    borderRadius: "9px",
                    border: "1.5px solid var(--border)",
                    background: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontFamily: "var(--font-primary)",
                    textAlign: "center",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.color = "var(--blue)";
                    e.currentTarget.style.background = "var(--blue-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  📋 Copy Link
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "8px 5px",
                    borderRadius: "9px",
                    border: "1.5px solid var(--border)",
                    background: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontFamily: "var(--font-primary)",
                    textAlign: "center",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--blue)";
                    e.currentTarget.style.color = "var(--blue)";
                    e.currentTarget.style.background = "var(--blue-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  📣 Circle
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fdin .25s ease",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowApplyModal(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px 20px 0 0",
              width: "100%",
              maxWidth: "580px",
              padding: "22px 26px 34px",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "38px",
                height: "4px",
                background: "var(--border)",
                borderRadius: "2px",
                margin: "0 auto 18px",
              }}
            />
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "var(--ink)",
                marginBottom: "4px",
              }}
            >
              Apply for {job.title}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "18px" }}>
              Takes less than 2 minutes · Employer responds within 24 hours
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                background: "var(--blue-light)",
                borderRadius: "10px",
                border: "1px solid rgba(27,79,138,.1)",
                marginBottom: "18px",
              }}
            >
              <div style={{ fontSize: "22px" }}>💼</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                  {job.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                  {employer.name || "Employer"} · ₹{job.payMin?.toLocaleString() || "N/A"}/mo · {job.location}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                Years of Experience
              </div>
              <select
                value={applyForm.experience}
                onChange={(e) => setApplyForm((prev) => ({ ...prev, experience: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontFamily: "var(--font-primary)",
                  fontSize: "13px",
                  color: "var(--ink)",
                  outline: "none",
                  transition: "all .15s",
                  cursor: "pointer",
                }}
              >
                <option value="">Select...</option>
                <option value="0-1">0–1 years</option>
                <option value="1-3">1–3 years</option>
                <option value="3-5">3–5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                Your relevant skills <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)" }}>Optional</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {availableSkills.map((skill) => (
                  <div
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "1.5px solid var(--border)",
                      cursor: "pointer",
                      transition: "all .15s",
                      background: applyForm.skills.includes(skill) ? "var(--blue)" : "white",
                      color: applyForm.skills.includes(skill) ? "white" : "var(--muted)",
                      borderColor: applyForm.skills.includes(skill) ? "var(--blue)" : "var(--border)",
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                Why are you a good fit? <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)" }}>Optional — helps get shortlisted</span>
              </div>
              <textarea
                value={applyForm.message}
                onChange={(e) => setApplyForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Tell the employer briefly about your experience and why you want this job..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontFamily: "var(--font-primary)",
                  fontSize: "13px",
                  color: "var(--ink)",
                  outline: "none",
                  transition: "all .15s",
                  resize: "vertical",
                  minHeight: "78px",
                  lineHeight: 1.65,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button
                onClick={() => setShowApplyModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "11px",
                  border: "1.5px solid var(--border)",
                  background: "white",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "var(--font-primary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={loading || !applyForm.experience}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "11px",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: loading || !applyForm.experience ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-primary)",
                  background: "linear-gradient(135deg, var(--blue), var(--blue-mid))",
                  color: "white",
                  boxShadow: "0 3px 10px rgba(27,79,138,.25)",
                  opacity: loading || !applyForm.experience ? 0.6 : 1,
                }}
              >
                {loading ? "Sending..." : "📝 Send Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

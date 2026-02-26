import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function MyProfilePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const profile = user.profile;
  const trustScore = profile?.trustScore ?? 0;
  const trustPercentage = Math.round((trustScore / 200) * 100);
  const nextLevel = 160;
  const progressToNext = Math.round(((trustScore - 142) / (nextLevel - 142)) * 100);

  // Fetch vouches
  const vouches = await prisma.trustVouch.findMany({
    where: { voucheeId: user.id },
    include: {
      voucher: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // Fetch job stats
  let jobsApplied = 0;
  let jobsHired = 0;
  try {
    if ('application' in prisma) {
      jobsApplied = await (prisma as any).application.count({
        where: { seekerId: user.id },
      });
      jobsHired = await (prisma as any).application.count({
        where: {
          seekerId: user.id,
          status: "HIRED",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching job stats:", error);
  }

  // Calculate trust breakdown
  const phoneVerified = profile?.phone ? 20 : 0;
  const profileComplete = [
    profile?.bio,
    user.image,
    profile?.nativePlaceState,
    profile?.currentCity,
    profile?.profession,
  ].filter(Boolean).length >= 5 ? 15 : 0;
  const vouchesPoints = Math.min(vouches.length * 10, 30);
  const reviewsPoints = 40; // Placeholder - would need review system
  const aadhaarVerified = profile?.aadhaarVerified ? 20 : 0;

  const displayName = user.name ?? user.username ?? "User";
  const nativeState = profile?.nativePlaceState || "";
  const currentLocation = [
    profile?.currentCity,
    profile?.currentState,
  ]
    .filter(Boolean)
    .join(", ") || "Location not set";
  const profession = profile?.profession || "Not specified";
  const bio = profile?.bio || "No bio yet.";

  // Get initials for avatar
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Get state emoji
  const getStateEmoji = (state: string) => {
    if (state === "Bihar") return "🌾";
    if (state === "Uttar Pradesh" || state === "UP") return "🏛️";
    if (state === "Odisha") return "🌊";
    if (state === "West Bengal" || state === "Bengal") return "🐯";
    return "📍";
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <main
        className="mx-auto"
        style={{
          maxWidth: "1400px",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: "240px 1fr 300px",
          }}
        >
          {/* Left Sidebar - Profile Sections */}
          <aside
            className="hidden lg:block border-r"
            style={{
              padding: "24px 16px",
              borderRight: "1px solid var(--border)",
              background: "var(--cream)",
              minHeight: "600px",
              position: "sticky",
              top: "64px",
              height: "calc(100vh - 64px)",
              overflowY: "auto",
            }}
          >
            <div className="sidebar-section" style={{ marginBottom: "28px" }}>
              <div
                className="sidebar-heading"
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  padding: "0 8px",
                  marginBottom: "8px",
                }}
              >
                Profile Sections
              </div>
              <nav
                className="sidebar-nav"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {[
                  { icon: "👤", label: "My Profile", href: "/profile/me", active: true },
                  { icon: "💼", label: "Job History", href: "/profile/me/jobs" },
                  { icon: "🔧", label: "My Services", href: "/profile/me/services" },
                  { icon: "⭐", label: "Reviews", href: "/profile/me/reviews" },
                  { icon: "🤝", label: "Vouches", href: "/profile/me/vouches" },
                  { icon: "⚙️", label: "Settings", href: "/profile/me/settings" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`sidebar-link ${link.active ? "active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: link.active ? 600 : 500,
                      color: link.active ? "var(--saffron)" : "var(--muted)",
                      background: link.active
                        ? "linear-gradient(135deg, var(--saffron-light), var(--saffron-light))"
                        : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textDecoration: "none",
                      position: "relative",
                    }}
                  >
                    {link.active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2"
                        style={{
                          width: "3px",
                          height: "20px",
                          background: "var(--saffron)",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "16px",
                        width: "20px",
                        textAlign: "center",
                      }}
                    >
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main
            style={{
              padding: "24px 28px",
              background: "var(--paper)",
            }}
          >
            {/* Profile Card */}
            <div
              className="profile-card"
              style={{
                background: "white",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              {/* Banner */}
              <div
                className="profile-banner"
                style={{
                  height: "90px",
                  background: "linear-gradient(135deg, var(--blue) 0%, var(--saffron) 100%)",
                  position: "relative",
                }}
              >
                <div
                  className="profile-banner-pattern"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.1,
                    backgroundImage: `
                      radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                      radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                      radial-gradient(circle at 60% 80%, white 1px, transparent 1px)
                    `,
                    backgroundSize: "30px 30px",
                  }}
                />
              </div>

              {/* Profile Body */}
              <div
                className="profile-body"
                style={{
                  padding: "16px 20px 20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    className="profile-avatar-wrap"
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      border: "3px solid white",
                      boxShadow: "var(--shadow-sm)",
                      marginTop: "-36px",
                      marginBottom: "10px",
                      background: "linear-gradient(135deg, var(--blue-mid), var(--blue))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "22px",
                      fontWeight: 700,
                      position: "relative",
                    }}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={displayName}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <Link
                    href="/profile/me/edit"
                    className="btn-secondary"
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      padding: "8px 16px",
                      textDecoration: "none",
                    }}
                  >
                    ✏️ Edit Profile
                  </Link>
                </div>

                <div
                  className="profile-name"
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                    color: "var(--ink)",
                    marginBottom: "4px",
                  }}
                >
                  {displayName}
                </div>

                <div
                  className="profile-meta"
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {nativeState && (
                    <>
                      <span
                        className="fc-state-badge"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "var(--gold-light)",
                          border: "1px solid rgba(201,146,10,0.2)",
                          borderRadius: "100px",
                          padding: "2px 8px",
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--gold)",
                        }}
                      >
                        {getStateEmoji(nativeState)} {nativeState}
                      </span>
                      <span
                        className="profile-sep"
                        style={{
                          width: "3px",
                          height: "3px",
                          background: "var(--border)",
                          borderRadius: "50%",
                        }}
                      />
                    </>
                  )}
                  <span>📍 {currentLocation}</span>
                  <span
                    className="profile-sep"
                    style={{
                      width: "3px",
                      height: "3px",
                      background: "var(--border)",
                      borderRadius: "50%",
                    }}
                  />
                  <span>🧱 {profession}</span>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    marginTop: "10px",
                    lineHeight: 1.7,
                  }}
                >
                  {bio}
                </div>

                {/* Trust Score Widget */}
                <div
                  className="trust-score-widget"
                  style={{
                    background: "var(--cream)",
                    borderRadius: "14px",
                    padding: "16px",
                    marginTop: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <svg
                    className="trust-ring-svg"
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    style={{ flexShrink: 0 }}
                  >
                    <defs>
                      <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: "var(--saffron)" }} />
                        <stop offset="100%" style={{ stopColor: "var(--gold)" }} />
                      </linearGradient>
                    </defs>
                    <circle
                      className="trust-ring-bg"
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="5"
                    />
                    <circle
                      className="trust-ring-fill"
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="url(#trustGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - trustPercentage / 100)}`}
                      transform="rotate(-90 32 32)"
                    />
                    <text
                      className="trust-number"
                      x="32"
                      y="37"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="800"
                      fill="var(--ink)"
                      fontFamily="var(--font-primary)"
                    >
                      {trustScore}
                    </text>
                  </svg>
                  <div className="trust-info" style={{ flex: 1 }}>
                    <div
                      className="trust-label"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Trust Score
                    </div>
                    <div
                      className="trust-value"
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "var(--ink)",
                        letterSpacing: "-1px",
                        lineHeight: 1,
                      }}
                    >
                      {trustScore} / 200
                    </div>
                    <div
                      className="trust-sub"
                      style={{
                        fontSize: "11px",
                        color: "var(--saffron)",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      🥈 Community Trusted
                    </div>
                    <div
                      style={{
                        height: "4px",
                        background: "var(--border)",
                        borderRadius: "2px",
                        marginTop: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "2px",
                          background: "linear-gradient(90deg, var(--saffron), var(--gold))",
                          width: `${Math.max(0, Math.min(100, progressToNext))}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--muted)",
                        marginTop: "4px",
                      }}
                    >
                      Next level at {nextLevel}
                    </div>
                  </div>
                </div>

                {/* Trust Breakdown */}
                <div
                  className="trust-breakdown"
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {[
                    {
                      done: phoneVerified > 0,
                      label: "Phone Verified",
                      pts: phoneVerified,
                    },
                    {
                      done: profileComplete > 0,
                      label: "Profile Complete",
                      pts: profileComplete,
                    },
                    {
                      done: vouchesPoints > 0,
                      label: `${vouches.length} Community Vouches`,
                      pts: vouchesPoints,
                    },
                    {
                      done: reviewsPoints > 0,
                      label: "8 Positive Reviews",
                      pts: reviewsPoints,
                    },
                    {
                      done: aadhaarVerified > 0,
                      label: "Aadhaar Verified",
                      pts: aadhaarVerified,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="tb-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                      }}
                    >
                      <div
                        className={`tb-check ${item.done ? "done" : "pending"}`}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "9px",
                          color: "white",
                          flexShrink: 0,
                          background: item.done ? "var(--green)" : "var(--border)",
                        }}
                      >
                        {item.done ? "✓" : "○"}
                      </div>
                      <span
                        className="tb-label"
                        style={{
                          flex: 1,
                          color: item.done ? "var(--ink)" : "var(--muted)",
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="tb-pts"
                        style={{
                          fontWeight: 700,
                          color: item.done ? "var(--ink)" : "var(--muted)",
                        }}
                      >
                        +{item.pts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {[
                { value: jobsApplied, label: "Jobs Applied", color: "var(--ink)" },
                { value: jobsHired, label: "Jobs Hired", color: "var(--green)" },
                { value: vouches.length, label: "Vouches", color: "var(--saffron)" },
                { value: "4.8⭐", label: "Avg Rating", color: "var(--gold)" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    padding: "16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      letterSpacing: "-1px",
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      fontWeight: 600,
                      marginTop: "2px",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Right Sidebar - Vouches */}
          <aside
            className="hidden lg:block border-l"
            style={{
              padding: "24px 20px",
              borderLeft: "1px solid var(--border)",
              background: "white",
              position: "sticky",
              top: "64px",
              height: "calc(100vh - 64px)",
              overflowY: "auto",
            }}
          >
            <div className="rp-section" style={{ marginBottom: "24px" }}>
              <div
                className="rp-title"
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "12px",
                }}
              >
                Vouches Received
              </div>
              {vouches.length === 0 ? (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    padding: "12px",
                    background: "var(--cream)",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                  }}
                >
                  No vouches yet. Ask your community members to vouch for you!
                </div>
              ) : (
                vouches.map((vouch) => {
                  const voucherName = vouch.voucher.name || vouch.voucher.username || "Member";
                  const initials = voucherName
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 1)
                    .join("")
                    .toUpperCase();
                  const avatarColors = [
                    "linear-gradient(135deg, #1B4F8A, #2563B0)",
                    "linear-gradient(135deg, #1B6B45, #27A06A)",
                    "linear-gradient(135deg, #C9920A, #A67206)",
                  ];
                  const colorIndex = vouches.indexOf(vouch) % avatarColors.length;

                  return (
                    <div
                      key={vouch.id}
                      className="member-mini"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="mm-avatar"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                          background: avatarColors[colorIndex],
                        }}
                      >
                        {vouch.voucher.image ? (
                          <img
                            src={vouch.voucher.image}
                            alt={voucherName}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="mm-info" style={{ flex: 1 }}>
                        <div
                          className="mm-name"
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--ink)",
                          }}
                        >
                          {voucherName}
                        </div>
                        <div
                          className="mm-occ"
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                            fontStyle: "italic",
                          }}
                        >
                          {vouch.note || "Vouched for you"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeedPost from "@/components/community/FeedPost";
import PostComposerModal from "@/components/community/PostComposerModal";
import { CircleLevel, CommunityPostType } from "@prisma/client";

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myCircles, setMyCircles] = useState<any[]>([]);
  const [discoverCircles, setDiscoverCircles] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [peopleFromBihar, setPeopleFromBihar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);
  const [feedMode, setFeedMode] = useState<"community" | "global">("community");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<CommunityPostType | undefined>(undefined);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callback=/community");
      return;
    }
    if (status === "authenticated") {
      fetchCircles();
    }
  }, [status, router]);

  useEffect(() => {
    if (feedMode === "global") {
      fetchGlobalFeed();
    } else if (primaryCircle) {
      fetchFeed(primaryCircle.id);
      fetchUpcomingEvents(primaryCircle.id);
      fetchPeople(primaryCircle.id);
    }
  }, [primaryCircle, activeFilter, feedMode]);

  const handlePostCreated = () => {
    if (feedMode === "global") {
      fetchGlobalFeed();
    } else if (primaryCircle) {
      fetchFeed(primaryCircle.id);
    }
  };

  const fetchCircles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/community/circles");
      if (res.ok) {
        const data = await res.json();
        const all = [
          ...(data.circles.STATE || []),
          ...(data.circles.DISTRICT || []),
          ...(data.circles.MOHALLA || []),
        ];
        const circles = all.filter((c: any) => c.isMember);
        const discover = all.filter((c: any) => !c.isMember);
        setMyCircles(circles);
        setDiscoverCircles(discover);
        
        const primary = circles.find((c: any) => c.level === CircleLevel.STATE);
        if (primary) {
          setPrimaryCircle(primary);
        } else {
          setLoading(false);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to load circles");
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch circles:", error);
      setError("Failed to load circles. Please try again.");
      setLoading(false);
    }
  };

  const fetchFeed = async (circleId: string) => {
    try {
      const type = activeFilter === "all" ? null : activeFilter;
      const url = type && type !== "all"
        ? `/api/community/circles/${circleId}/feed?type=${type}`
        : `/api/community/circles/${circleId}/feed`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all community posts from all circles
      const type = activeFilter === "all" ? null : activeFilter;
      const url = type && type !== "all"
        ? `/api/community/feed/global?type=${type}`
        : `/api/community/feed/global`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.items || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to load global feed");
      }
    } catch (error) {
      console.error("Failed to fetch global feed:", error);
      setError("Failed to load global feed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async (circleId: string) => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/feed?type=MEETUP`);
      if (res.ok) {
        const data = await res.json();
        const upcoming = (data.items || []).filter((item: any) => {
          if (item.meetup?.meetupDate) {
            return new Date(item.meetup.meetupDate) > new Date();
          }
          return false;
        }).slice(0, 3);
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchPeople = async (circleId: string) => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/members?limit=3`);
      if (res.ok) {
        const data = await res.json();
        setPeopleFromBihar(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch people:", error);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return { day, month };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--paper)" }}>
        <Navbar />
        <main className="mx-auto max-w-[1380px] px-6 py-8">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <main
        className="mx-auto"
        style={{
          maxWidth: "1380px",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: "232px 1fr 272px",
          }}
        >
          {/* Left Sidebar */}
          <aside
            className="hidden lg:block border-r sticky"
            style={{
              padding: "20px 14px",
              background: "white",
              borderRight: "1px solid var(--border)",
              top: "64px",
              height: "calc(100vh - 64px)",
              overflowY: "auto",
            }}
          >
            {/* Circle Card */}
            {primaryCircle && (
              <div
                className="rounded-2xl p-4 mb-3 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--blue) 0%, var(--blue-mid) 100%)",
                  color: "white",
                  marginBottom: "12px",
                }}
              >
                <div
                  className="absolute right-[-20px] top-[-20px] w-20 h-20 rounded-full opacity-60"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    opacity: 0.55,
                  }}
                >
                  MY PRIMARY CIRCLE
                </div>
                <div
                  className="font-devanagari"
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    margin: "3px 0 2px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {primaryCircle.name} · {primaryCircle.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    opacity: 0.6,
                  }}
                >
                  📍 {primaryCircle.city || "Pune"}, {primaryCircle.state || "Maharashtra"}
                </div>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    letterSpacing: "-1px",
                    marginTop: "12px",
                    lineHeight: 1,
                  }}
                >
                  {primaryCircle.memberCount?.toLocaleString() || "0"}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    opacity: 0.55,
                    marginTop: "1px",
                  }}
                >
                  members nearby
                </div>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#34D399",
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "10px",
                      opacity: 0.7,
                      fontWeight: 600,
                    }}
                  >
                    Very Active — 47 posts this week
                  </div>
                </div>
              </div>
            )}

            {/* Navigate Section */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  padding: "0 8px",
                  marginBottom: "6px",
                }}
              >
                NAVIGATE
              </div>
              <nav
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                }}
              >
                {[
                  { icon: "📰", label: "Community Feed", href: "/community", active: true },
                  { icon: "💼", label: "Jobs", href: "/jobs", badge: "12" },
                  { icon: "🔧", label: "Services", href: "/services" },
                  { icon: "🎉", label: "Events", href: "/events" },
                  { icon: "👥", label: "My Circles", href: primaryCircle ? `/community/${primaryCircle.id}` : "/community" },
                  { icon: "🚨", label: "SOS", href: "/community", badge: "2", badgeColor: "coral" },
                  { icon: "💬", label: "Messages", href: "/messages", badge: "3" },
                  { icon: "💡", label: "Apna Gyaan", href: primaryCircle ? `/community/${primaryCircle.id}/gyaan` : "/community" },
                ].map((link, index) => (
                  <Link
                    key={`nav-${link.label}-${index}`}
                    href={link.href}
                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all no-underline relative"
                    style={{
                      background: link.active ? "var(--saffron-light)" : "transparent",
                      color: link.active ? "var(--saffron)" : "var(--muted)",
                      fontWeight: link.active ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!link.active) {
                        e.currentTarget.style.background = "var(--cream)";
                        e.currentTarget.style.color = "var(--ink)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!link.active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--muted)";
                      }
                    }}
                  >
                    {link.active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2"
                        style={{
                          width: "3px",
                          height: "18px",
                          background: "var(--saffron)",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                    <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>
                      {link.icon}
                    </span>
                    <span className="flex-1">{link.label}</span>
                    {link.badge && (
                      <span
                        style={{
                          background: link.badgeColor === "coral" ? "var(--color-danger)" : "var(--saffron)",
                          color: "white",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: "100px",
                        }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Other Circles */}
            {discoverCircles.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    padding: "0 8px",
                    marginBottom: "6px",
                  }}
                >
                  OTHER CIRCLES
                </div>
                <nav
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1px",
                  }}
                >
                  {discoverCircles.slice(0, 3).map((circle) => (
                    <Link
                      key={circle.id}
                      href={`/community/${circle.id}`}
                      className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all no-underline"
                      style={{
                        color: "var(--muted)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--cream)";
                        e.currentTarget.style.color = "var(--ink)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--muted)";
                      }}
                    >
                      <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>
                        {circle.level === CircleLevel.STATE ? "🏛️" : circle.level === CircleLevel.DISTRICT ? "🌊" : "🐯"}
                      </span>
                      <span className="flex-1">
                        {circle.name} · {(circle.memberCount || 0).toLocaleString()}
                      </span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main
            style={{
              padding: "20px 24px",
              background: "var(--paper)",
            }}
          >
            {/* Page Header */}
            <div
              className="flex items-start justify-between mb-4.5"
              style={{ marginBottom: "18px" }}
            >
              <div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--ink)",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {feedMode === "global" ? "Global Feed" : "Community Feed"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    marginTop: "2px",
                  }}
                >
                  {feedMode === "global" 
                    ? "All jobs, services and events in the application" 
                    : `${primaryCircle?.name || "Bihar Circle"} · ${primaryCircle?.city || "Pune"} · 47 posts this week`}
                </div>
              </div>
              {primaryCircle && (
                <button
                  onClick={() => {
                    setComposerType(undefined);
                    setIsComposerOpen(true);
                  }}
                  className="btn-primary"
                  style={{
                    fontSize: "13px",
                    padding: "9px 18px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✏️ Post Update
                </button>
              )}
            </div>

            {/* Feed Toggle */}
            <div
              className="flex gap-1 mb-4.5 rounded-2xl p-1 border"
              style={{
                background: "var(--cream)",
                borderRadius: "14px",
                padding: "4px",
                border: "1px solid var(--border)",
                marginBottom: "18px",
              }}
            >
              <button
                onClick={() => setFeedMode("community")}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all border-none flex items-center justify-center gap-2"
                style={{
                  background: feedMode === "community" ? "var(--blue)" : "transparent",
                  color: feedMode === "community" ? "white" : "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  if (feedMode !== "community") {
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (feedMode !== "community") {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "15px" }}>👥</span>
                {primaryCircle?.name?.replace(" Circle", "") || "Bihar"} Circle
                {feedMode === "community" && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.3)",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "100px",
                    }}
                  >
                    4
                  </span>
                )}
              </button>
              <button
                onClick={() => setFeedMode("global")}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all border-none flex items-center justify-center gap-2"
                style={{
                  background: feedMode === "global" ? "var(--saffron)" : "transparent",
                  color: feedMode === "global" ? "white" : "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  if (feedMode !== "global") {
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (feedMode !== "global") {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "15px" }}>🌐</span>
                Global Feed
              </button>
            </div>

            {/* Composer */}
            {feedMode === "community" && primaryCircle && (
              <div
                className="bg-white rounded-2xl border p-3.5 mb-3.5 flex items-center gap-3 cursor-text transition-all"
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  marginBottom: "14px",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--saffron)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
                onClick={() => {
                  setComposerType(undefined);
                  setIsComposerOpen(true);
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                  }}
                >
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    color: "var(--muted)",
                  }}
                >
                  Share something with {primaryCircle.name}...
                </div>
                <div className="flex gap-1.5">
                  {[
                    { icon: "💼", label: "Job" },
                    { icon: "📍", label: "Meetup" },
                    { icon: "💡", label: "Tip" },
                    { icon: "🚨", label: "SOS", sos: true },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: action.sos ? "var(--color-danger-light)" : "var(--cream)",
                        color: action.sos ? "var(--color-danger)" : "var(--muted)",
                        border: "1px solid var(--border)",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (action.sos) {
                          e.currentTarget.style.background = "var(--color-danger)";
                          e.currentTarget.style.color = "white";
                        } else {
                          e.currentTarget.style.background = "var(--saffron-light)";
                          e.currentTarget.style.color = "var(--saffron)";
                          e.currentTarget.style.borderColor = "rgba(232,98,26,0.25)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (action.sos) {
                          e.currentTarget.style.background = "var(--color-danger-light)";
                          e.currentTarget.style.color = "var(--color-danger)";
                        } else {
                          e.currentTarget.style.background = "var(--cream)";
                          e.currentTarget.style.color = "var(--muted)";
                          e.currentTarget.style.borderColor = "var(--border)";
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const typeMap: Record<string, CommunityPostType> = {
                          Job: CommunityPostType.JOB_SHARE,
                          Meetup: CommunityPostType.MEETUP,
                          Tip: CommunityPostType.GYAAN,
                          SOS: CommunityPostType.SOS,
                        };
                        setComposerType(typeMap[action.label] || CommunityPostType.GENERAL);
                        setIsComposerOpen(true);
                      }}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div
              className="flex gap-1.5 items-center mb-4 flex-wrap"
              style={{
                marginBottom: "16px",
              }}
            >
              {[
                { id: "all", label: "🔥 All" },
                { id: "SOS", label: "🚨 SOS" },
                { id: "JOB_SHARE", label: "💼 Jobs" },
                { id: "EVENT_SHARE", label: "🎉 Events" },
                { id: "MEETUP", label: "📍 Meetups" },
                { id: "GYAAN", label: "💡 Gyaan" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setActiveFilter(filter.id);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border-none"
                  style={{
                    padding: "6px 13px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: activeFilter === filter.id ? "var(--saffron)" : "white",
                    border: "1.5px solid",
                    borderColor: activeFilter === filter.id ? "var(--saffron)" : "var(--border)",
                    color: activeFilter === filter.id ? "white" : "var(--muted)",
                  }}
                  onMouseEnter={(e) => {
                    if (activeFilter !== filter.id) {
                      e.currentTarget.style.borderColor = "var(--saffron)";
                      e.currentTarget.style.color = "var(--saffron)";
                      e.currentTarget.style.background = "var(--saffron-light)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFilter !== filter.id) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--muted)";
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Feed Posts */}
            {error && (
              <div
                className="rounded-2xl border p-4 mb-3"
                style={{
                  borderColor: "var(--color-danger)",
                  background: "var(--color-danger-light)",
                  color: "var(--color-danger)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {feed.length === 0 && !loading ? (
              <div
                className="rounded-2xl border p-8 text-center"
                style={{
                  background: "white",
                  borderColor: "var(--border)",
                  color: "var(--muted)",
                }}
              >
                No posts yet. Be the first to share!
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((post) => (
                  <FeedPost key={post.id} post={post} />
                ))}
              </div>
            )}
          </main>

          {/* Right Panel */}
          <aside
            className="hidden lg:block border-l sticky"
            style={{
              padding: "20px 18px",
              borderLeft: "1px solid var(--border)",
              background: "white",
              top: "64px",
              height: "calc(100vh - 64px)",
              overflowY: "auto",
            }}
          >
            {/* Trust Score Widget */}
            <div className="rp-section" style={{ marginBottom: "24px" }}>
              <div
                className="bg-[var(--cream)] rounded-xl p-3.5 flex items-center gap-3.5"
                style={{
                  background: "var(--cream)",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: "var(--saffron)" }} />
                      <stop offset="100%" style={{ stopColor: "var(--gold)" }} />
                    </linearGradient>
                  </defs>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="url(#trustGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="138"
                    strokeDashoffset="40"
                    transform="rotate(-90 28 28)"
                  />
                  <text
                    x="28"
                    y="33"
                    textAnchor="middle"
                    fontSize="13"
                    fontWeight="800"
                    fill="var(--ink)"
                    fontFamily="Sora, sans-serif"
                  >
                    142
                  </text>
                </svg>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--muted)",
                    }}
                  >
                    Trust Score
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "var(--ink)",
                      letterSpacing: "-1px",
                      lineHeight: 1,
                    }}
                  >
                    142
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--saffron)",
                      fontWeight: 700,
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
                        width: "71%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Helpers */}
            <div className="rp-section" style={{ marginBottom: "24px" }}>
              <div
                className="flex items-center justify-between mb-3"
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "12px",
                }}
              >
                <span>🏆 Top Helpers This Month</span>
                <Link
                  href={primaryCircle ? `/community/${primaryCircle.id}/leaderboard` : "/community"}
                  style={{
                    fontSize: "11px",
                    color: "var(--saffron)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  See all →
                </Link>
              </div>
              <div className="space-y-0">
                {[
                  { rank: "🥇", name: "Arun Lal", category: "Most Helpful", score: "48 pts", bg: "var(--saffron)" },
                  { rank: "🥈", name: "Poonam Devi", category: "Job Connector", score: "35 pts", bg: "var(--green)" },
                  { rank: "🥉", name: "Santosh M.", category: "Top Organizer", score: "28 pts", bg: "var(--gold)" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 py-1.5 border-b"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        width: "20px",
                        color: idx === 0 ? "#F59E0B" : idx === 1 ? "#94A3B8" : "#B45309",
                      }}
                    >
                      {item.rank}
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${item.bg}, ${item.bg})`,
                      }}
                    >
                      {item.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--muted)",
                        }}
                      >
                        {item.category}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "var(--saffron)",
                      }}
                    >
                      {item.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Circle Events */}
            <div className="rp-section" style={{ marginBottom: "24px" }}>
              <div
                className="flex items-center justify-between mb-3"
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "12px",
                }}
              >
                <span>📅 Circle Events</span>
                <Link
                  href={primaryCircle ? `/community/${primaryCircle.id}?tab=events` : "/events"}
                  style={{
                    fontSize: "11px",
                    color: "var(--saffron)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  See all →
                </Link>
              </div>
              <div className="space-y-2">
                {upcomingEvents.length === 0 ? (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      padding: "10px 12px",
                    }}
                  >
                    No upcoming events
                  </div>
                ) : (
                  upcomingEvents.map((event: any) => {
                    const eventDate = event.meetup?.meetupDate
                      ? formatDate(event.meetup.meetupDate)
                      : null;
                    return (
                      <div
                        key={event.id}
                        className="bg-[var(--cream)] rounded-xl border p-2.5 cursor-pointer transition-all"
                        style={{
                          background: "var(--cream)",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          marginBottom: "7px",
                          border: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--green)";
                          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {event.meetup?.title || event.content?.slice(0, 30) + "..."}
                          </div>
                          {eventDate && (
                            <div
                              className="text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0"
                              style={{
                                background: "var(--green-light)",
                                color: "var(--green)",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {eventDate.day}
                              <div style={{ fontSize: "10px", textTransform: "uppercase" }}>
                                {eventDate.month}
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                          }}
                        >
                          📍 {event.meetup?.location || "Location TBD"} · {event.meetup?.rsvpCount || 0} going
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* People from Circle */}
            <div className="rp-section">
              <div
                className="flex items-center justify-between mb-3"
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: "12px",
                }}
              >
                <span>👥 {primaryCircle?.name?.replace(" Circle", "") || "Bihar"} Members Nearby</span>
                <Link
                  href={primaryCircle ? `/community/${primaryCircle.id}/members` : "/people"}
                  style={{
                    fontSize: "11px",
                    color: "var(--saffron)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  See all →
                </Link>
              </div>
              <div className="space-y-0">
                {peopleFromBihar.length === 0 ? (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      padding: "8px 0",
                    }}
                  >
                    No members found
                  </div>
                ) : (
                  peopleFromBihar.map((member: any) => {
                    const user = member.user || {};
                    const profile = user.profile || {};
                    const initials = (user.name || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-2.5 py-2 border-b cursor-pointer"
                        style={{
                          borderBottom: "1px solid var(--border)",
                          padding: "8px 0",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--cream)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{
                            width: "34px",
                            height: "34px",
                            background: "linear-gradient(135deg, var(--blue-mid), var(--blue))",
                          }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {user.name || "Anonymous"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--muted)",
                            }}
                          >
                            {profile.profession || "Member"} · {profile.currentCity || "Unknown"}
                          </div>
                        </div>
                        <button
                          className="text-xs font-semibold border rounded-md px-2.5 py-1 whitespace-nowrap"
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--saffron)",
                            border: "1px solid rgba(232,98,26,0.25)",
                            background: "var(--saffron-light)",
                            borderRadius: "7px",
                            padding: "4px 10px",
                            marginLeft: "auto",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--saffron)";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--saffron-light)";
                            e.currentTarget.style.color = "var(--saffron)";
                          }}
                        >
                          + Connect
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Post Composer Modal */}
      {primaryCircle && (
        <PostComposerModal
          isOpen={isComposerOpen}
          onClose={() => {
            setIsComposerOpen(false);
            setComposerType(undefined);
          }}
          circleId={primaryCircle.id}
          circleName={primaryCircle.name}
          onPostCreated={handlePostCreated}
          initialType={composerType}
        />
      )}
    </div>
  );
}

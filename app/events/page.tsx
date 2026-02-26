"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CommunityPostType } from "@prisma/client";

type EventItem = {
  id: string;
  type: CommunityPostType;
  content: string;
  createdAt: Date | string;
  meetup?: {
    id: string;
    title: string;
    location: string;
    meetupDate: Date | string;
    rsvpCount: number;
    isActive: boolean;
  };
  author: {
    name: string | null;
    profile?: {
      nativePlaceState?: string | null;
    } | null;
  };
  _count?: {
    likes: number;
    replies: number;
  };
};

const CATEGORY_FILTERS = [
  { id: "all", label: "🔥 All", icon: "🔥" },
  { id: "cultural", label: "🪔 Cultural", icon: "🪔" },
  { id: "religious", label: "🙏 Religious", icon: "🙏" },
  { id: "professional", label: "💼 Professional", icon: "💼" },
  { id: "social", label: "🎊 Social", icon: "🎊" },
];

export default function EventsListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callback=/events");
      return;
    }
    if (status === "authenticated") {
      fetchPrimaryCircle();
    }
  }, [status, router]);

  useEffect(() => {
    if (primaryCircle) {
      fetchEvents(primaryCircle.id);
    } else {
      fetchAllEvents();
    }
  }, [primaryCircle, activeCategory]);

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

  const fetchEvents = async (circleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/community/circles/${circleId}/feed?type=MEETUP`);
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).filter((item: any) => {
          if (item.meetup?.meetupDate) {
            return new Date(item.meetup.meetupDate) > new Date();
          }
          return false;
        });
        setEvents(items);
      } else {
        setError("Failed to load events");
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from all circles or use a global events endpoint
      const res = await fetch("/api/community/circles");
      if (res.ok) {
        const data = await res.json();
        const all = [
          ...(data.circles.STATE || []),
          ...(data.circles.DISTRICT || []),
          ...(data.circles.MOHALLA || []),
        ];
        const memberCircles = all.filter((c: any) => c.isMember);
        
        // Fetch events from all member circles
        const allEvents: EventItem[] = [];
        for (const circle of memberCircles.slice(0, 3)) {
          try {
            const eventRes = await fetch(`/api/community/circles/${circle.id}/feed?type=MEETUP`);
            if (eventRes.ok) {
              const eventData = await eventRes.json();
              const items = (eventData.items || []).filter((item: any) => {
                if (item.meetup?.meetupDate) {
                  return new Date(item.meetup.meetupDate) > new Date();
                }
                return false;
              });
              allEvents.push(...items);
            }
          } catch (err) {
            console.error(`Failed to fetch events from circle ${circle.id}:`, err);
          }
        }
        setEvents(allEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (activeCategory === "all") return events;
    const categoryLower = activeCategory.toLowerCase();
    return events.filter((event) => {
      const title = event.meetup?.title?.toLowerCase() || event.content?.toLowerCase() || "";
      const content = event.content?.toLowerCase() || "";
      const searchText = title + " " + content;
      
      if (categoryLower === "religious") {
        return searchText.includes("puja") || searchText.includes("religious") || searchText.includes("festival") || searchText.includes("chhath");
      }
      if (categoryLower === "cultural") {
        return searchText.includes("cultural") || searchText.includes("festival") || searchText.includes("food");
      }
      if (categoryLower === "professional") {
        return searchText.includes("job") || searchText.includes("fair") || searchText.includes("employer") || searchText.includes("career");
      }
      if (categoryLower === "social") {
        return searchText.includes("social") || searchText.includes("meetup") || searchText.includes("gathering");
      }
      return false;
    });
  }, [events, activeCategory]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    return { day, month };
  };

  const getEventCategory = (event: EventItem) => {
    const title = event.meetup?.title?.toLowerCase() || event.content?.toLowerCase() || "";
    const content = event.content?.toLowerCase() || "";
    const searchText = title + " " + content;
    
    if (searchText.includes("puja") || searchText.includes("religious") || searchText.includes("chhath")) {
      return { label: "RELIGIOUS", bg: "var(--gold-light)", color: "var(--gold)" };
    }
    if (searchText.includes("job") || searchText.includes("fair") || searchText.includes("employer")) {
      return { label: "JOB FAIR", bg: "var(--blue-light)", color: "var(--blue)" };
    }
    if (searchText.includes("social") || searchText.includes("meetup") || searchText.includes("gathering")) {
      return { label: "SOCIAL", bg: "var(--green-light)", color: "var(--green)" };
    }
    if (searchText.includes("cultural") || searchText.includes("festival") || searchText.includes("food")) {
      return { label: "CULTURAL", bg: "var(--saffron-light)", color: "var(--saffron)" };
    }
    return { label: "EVENT", bg: "var(--cream)", color: "var(--muted)" };
  };

  const getEventBannerStyle = (event: EventItem) => {
    const category = getEventCategory(event);
    if (category.label === "RELIGIOUS") {
      return { background: "linear-gradient(135deg, var(--gold-light), #FAE5A0)" };
    }
    if (category.label === "JOB FAIR") {
      return { background: "linear-gradient(135deg, var(--blue-light), #C5D9F5)" };
    }
    if (category.label === "SOCIAL" || category.label === "CULTURAL") {
      return { background: "linear-gradient(135deg, var(--green-light), #A8E0C0)" };
    }
    return { background: "linear-gradient(135deg, var(--saffron-light), #FDF0E8)" };
  };

  const getEventEmoji = (event: EventItem) => {
    const title = event.meetup?.title?.toLowerCase() || event.content?.toLowerCase() || "";
    if (title.includes("puja") || title.includes("chhath")) return "🪔";
    if (title.includes("job") || title.includes("fair")) return "💼";
    if (title.includes("food") || title.includes("festival")) return "🥘";
    if (title.includes("meetup") || title.includes("social")) return "🎊";
    return "🎉";
  };

  const getEventCapacity = (event: EventItem) => {
    // Default capacity based on event type
    const title = event.meetup?.title?.toLowerCase() || "";
    if (title.includes("job fair")) return 300;
    if (title.includes("puja") || title.includes("chhath")) return 500;
    if (title.includes("food") || title.includes("festival")) return 200;
    return 200;
  };

  const getEventFee = (event: EventItem) => {
    const content = event.content?.toLowerCase() || "";
    if (content.includes("₹99") || content.includes("rs 99")) return "₹99 Entry";
    if (content.includes("free") || content.includes("no entry")) return "Free Entry";
    return "Free";
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--paper)" }}>
        <Navbar />
        <main className="mx-auto max-w-[1100px] px-10 py-6">
          <p style={{ color: "var(--muted)" }}>Loading events...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <Navbar />
      <main style={{ padding: "24px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Page Header */}
        <div
          className="flex items-center justify-between mb-6"
          style={{ marginBottom: "24px" }}
        >
          <div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "var(--ink)",
              }}
            >
              Community Events
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--muted)",
                marginTop: "2px",
              }}
            >
              Cultural celebrations, job fairs & community meetups in {primaryCircle?.city || "Pune"}
            </div>
          </div>
          {session && (
            <Link
              href="/events/create"
              className="btn-primary"
              style={{
                fontSize: "13px",
                padding: "10px 18px",
                textDecoration: "none",
              }}
            >
              + Create Event
            </Link>
          )}
        </div>

        {/* Filter Tabs */}
        <div
          className="flex gap-1 mb-10 rounded-xl p-1 border"
          style={{
            background: "var(--cream)",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid var(--border)",
            marginBottom: "40px",
            maxWidth: "600px",
          }}
        >
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveCategory(filter.id)}
              className="flex-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-center border-none"
              style={{
                background: activeCategory === filter.id ? "white" : "transparent",
                color: activeCategory === filter.id ? "var(--ink)" : "var(--muted)",
                fontWeight: activeCategory === filter.id ? 600 : 500,
                boxShadow: activeCategory === filter.id ? "var(--shadow-sm)" : "none",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="rounded-2xl border p-4 mb-6"
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

        {/* Events Grid */}
        {filteredEvents.length === 0 && !loading ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              background: "white",
              borderColor: "var(--border)",
              color: "var(--muted)",
            }}
          >
            No events found. Be the first to create one!
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredEvents.map((event) => {
              const eventDate = event.meetup?.meetupDate
                ? formatDate(event.meetup.meetupDate)
                : null;
              const category = getEventCategory(event);
              const rsvpCount = event.meetup?.rsvpCount || 0;
              const capacity = getEventCapacity(event);
              const rsvpPercentage = Math.round((rsvpCount / capacity) * 100);
              const bannerStyle = getEventBannerStyle(event);
              const emoji = getEventEmoji(event);
              const fee = getEventFee(event);
              const state = event.author.profile?.nativePlaceState || "";

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all"
                  style={{
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Event Banner */}
                  <div
                    className="relative h-24 flex items-center justify-center"
                    style={{
                      height: "100px",
                      ...bannerStyle,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "36px",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      {emoji}
                    </span>
                    {eventDate && (
                      <div
                        className="absolute top-3 right-3 bg-white rounded-xl p-2 text-center shadow-sm"
                        style={{
                          top: "12px",
                          right: "12px",
                          background: "white",
                          borderRadius: "10px",
                          padding: "6px 10px",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "var(--ink)",
                            lineHeight: 1,
                          }}
                        >
                          {eventDate.day}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            color: "var(--muted)",
                          }}
                        >
                          {eventDate.month}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Body */}
                  <div style={{ padding: "14px 16px" }}>
                    {/* Category Tags */}
                    <div
                      className="flex gap-1.5 mb-2 flex-wrap"
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          background: category.bg,
                          color: category.color,
                          padding: "3px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {category.label}
                      </span>
                      {state && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: "var(--gold-light)",
                            color: "var(--gold)",
                            border: "1px solid rgba(201,146,10,0.2)",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "100px",
                          }}
                        >
                          {state === "Bihar" ? "🌾" : state === "Uttar Pradesh" ? "🏛️" : "📍"}{" "}
                          {state} Community
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        marginBottom: "6px",
                        color: "var(--ink)",
                      }}
                    >
                      {event.meetup?.title || event.content?.slice(0, 50) + "..."}
                    </div>

                    {/* Location & Entry */}
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <span>📍</span>
                      <span>{event.meetup?.location || "Location TBD"}</span>
                      <span>·</span>
                      <span>{fee.includes("₹") ? "🎟️" : "🆓"} {fee}</span>
                    </div>

                    {/* RSVP Progress Bar */}
                    <div style={{ marginTop: "12px" }}>
                      <div
                        className="flex items-center justify-between mb-1"
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          marginBottom: "4px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {rsvpCount} / {capacity} going
                        </span>
                        <span
                          style={{
                            color: "var(--green)",
                            fontWeight: 600,
                          }}
                        >
                          {rsvpPercentage}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "4px",
                          background: "var(--border)",
                          borderRadius: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: category.label === "JOB FAIR" ? "var(--blue)" : "var(--green)",
                            borderRadius: "2px",
                            width: `${rsvpPercentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

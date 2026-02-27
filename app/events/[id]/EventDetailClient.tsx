"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type EventDetailClientProps = {
  event: any;
  userRSVP: any;
  isAuthenticated: boolean;
  similarEvents: any[];
};

export default function EventDetailClient({
  event,
  userRSVP,
  isAuthenticated,
  similarEvents,
}: EventDetailClientProps) {
  const router = useRouter();
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(userRSVP?.status || null);
  const [loading, setLoading] = useState(false);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    attendees: "1",
    transport: "none",
  });
  const [rsvpCount, setRsvpCount] = useState(
    event.rsvps?.filter((r: any) => r.status === "YES").length || event._count?.rsvps || 0
  );

  const handleRSVP = async (status: "YES" | "NO") => {
    if (!isAuthenticated) {
      router.push("/auth/signin?callback=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const wasRSVPed = rsvpStatus === "YES";
        const willBeRSVPed = status === "YES";
        
        setRsvpStatus(status);
        
        if (willBeRSVPed && !wasRSVPed) {
          setRsvpCount((prev: number) => prev + 1);
        } else if (!willBeRSVPed && wasRSVPed) {
          setRsvpCount((prev: number) => Math.max(0, prev - 1));
        }
        
        if (status === "YES") {
          setShowRSVPModal(false);
        }
        
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to RSVP:", errorData.error);
        alert(errorData.error || "Failed to RSVP. Please try again.");
      }
    } catch (error) {
      console.error("Failed to RSVP:", error);
    } finally {
      setLoading(false);
    }
  };

  const creator = event.creator || {};
  const initials = (creator.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const eventDate = event.startsAt ? new Date(event.startsAt) : new Date();
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString("en-US", { month: "short" });
  const time = eventDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = eventDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getEventEmoji = () => {
    const title = event.title?.toLowerCase() || "";
    if (title.includes("puja") || title.includes("chhath")) return "🪔";
    if (title.includes("job") || title.includes("fair")) return "💼";
    if (title.includes("food") || title.includes("festival")) return "🥘";
    if (title.includes("meetup") || title.includes("social")) return "🎊";
    return "🎉";
  };

  const getEventCategory = () => {
    const title = event.title?.toLowerCase() || "";
    if (title.includes("puja") || title.includes("chhath") || title.includes("religious")) {
      return "🪔 Cultural Festival";
    }
    if (title.includes("job") || title.includes("fair")) {
      return "💼 Job Fair";
    }
    if (title.includes("social") || title.includes("meetup")) {
      return "🎊 Social Meetup";
    }
    return "🎉 Community Event";
  };

  const getStateEmoji = (state: string) => {
    switch (state) {
      case "Bihar": return "🌾";
      case "Uttar Pradesh": return "🏛️";
      case "Odisha": return "🌊";
      case "West Bengal": return "🐯";
      case "Rajasthan": return "🏜️";
      default: return "📍";
    }
  };

  const remainingSpots = event.capacity ? event.capacity - rsvpCount : null;
  const rsvpPercentage = event.capacity ? Math.round((rsvpCount / event.capacity) * 100) : 0;
  const isGlobal = event.community?.type === "GLOBAL";

  return (
    <>
      <div className="min-h-screen" style={{ background: "var(--paper)" }}>
        {/* Navbar with breadcrumb */}
        <div
          className="sticky top-0 z-50 border-b"
          style={{
            background: "rgba(247,243,238,0.97)",
            backdropFilter: "blur(16px)",
            borderColor: "var(--border)",
            padding: "0 32px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
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
            <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>
              REKKOMO
            </div>
            <div style={{ width: "1px", height: "18px", background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--muted)" }}>
              <Link href="/events" style={{ color: "var(--muted)", textDecoration: "none" }}>
                Events
              </Link>
              <span style={{ color: "var(--border)" }}>›</span>
              <span style={{ color: "var(--ink)", fontWeight: 700 }}>{getEventCategory().split(" ").slice(1).join(" ")}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => router.push("/events")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "9px",
                border: "1px solid var(--border)",
                background: "white",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--muted)",
                cursor: "pointer",
                fontFamily: "var(--font-primary)",
              }}
            >
              ← Back to Events
            </button>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "32px 28px 80px",
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN */}
          <div>
            {/* Event Hero */}
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
                style={{
                  height: "220px",
                  position: "relative",
                  overflow: "hidden",
                  background: event.coverImageUrl
                    ? `url(${event.coverImageUrl})`
                    : "linear-gradient(135deg, #FEF9C3, #FDE68A 50%, #FCD34D)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!event.coverImageUrl && (
                  <div
                    style={{
                      fontSize: "88px",
                      filter: "drop-shadow(0 8px 24px rgba(201,146,10,.3))",
                      animation: "float 4s ease-in-out infinite",
                    }}
                  >
                    {getEventEmoji()}
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: event.coverImageUrl
                      ? "linear-gradient(to top, rgba(0,0,0,.6), transparent 55%)"
                      : "linear-gradient(to top, rgba(0,0,0,.38), transparent 55%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "20px",
                    right: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,.2)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,.3)",
                      borderRadius: "100px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {getEventCategory()}
                  </div>
                  <div
                    style={{
                      background: "var(--gold)",
                      borderRadius: "100px",
                      padding: "6px 13px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "white",
                      boxShadow: "0 2px 8px rgba(201,146,10,.4)",
                    }}
                  >
                    ⭐ Featured Event
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "14px 24px",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "rgba(255,255,255,.95)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "11px",
                      padding: "9px 15px",
                      boxShadow: "var(--shadow-md)",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: 800,
                          color: "var(--ink)",
                          lineHeight: 1,
                          paddingRight: "12px",
                          borderRight: "1px solid var(--border)",
                        }}
                      >
                        {day}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          display: "block",
                        }}
                      >
                        {month}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)" }}>
                        {time}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                        {formattedDate.split(",")[0]}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: "white" }}>
                    <div
                      style={{
                        fontSize: "21px",
                        fontWeight: 800,
                        letterSpacing: "-0.4px",
                        textShadow: "0 2px 8px rgba(0,0,0,.3)",
                      }}
                    >
                      {event.title}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "3px" }}>
                      Organised by {event.community?.name || creator.name || "Community"} · {event.location || "Location TBD"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "20px 26px 24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "18px",
                  }}
                >
                  {event.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--muted)" }}>
                      📍 <span><strong>{event.location}</strong></span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--muted)" }}>
                    🆓 <strong>Free Entry</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--muted)" }}>
                    👥 <strong>{rsvpCount} going</strong> {event.capacity ? `· ${event.capacity} capacity` : ""}
                  </div>
                  {!isGlobal && creator.profile?.nativePlaceState && (
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--muted)" }}>
                      {getStateEmoji(creator.profile.nativePlaceState)} <strong>{creator.profile.nativePlaceState} Circle</strong> event
                    </div>
                  )}
                  {isGlobal && (
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "var(--muted)" }}>
                      🌍 <strong>Global</strong> event
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {event.capacity && (
                      <>
                        <div
                          style={{
                            height: "6px",
                            background: "var(--border)",
                            borderRadius: "3px",
                            overflow: "hidden",
                            marginBottom: "6px",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: "3px",
                              background: "linear-gradient(90deg, var(--green), #34D399)",
                              width: `${rsvpPercentage}%`,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            color: "var(--muted)",
                          }}
                        >
                          <span>
                            <span style={{ fontWeight: 800, color: "var(--green)" }}>{rsvpCount}</span> people going
                          </span>
                          <span>{remainingSpots} spots left</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {isAuthenticated ? (
                      <>
                        {rsvpStatus === "YES" ? (
                          <>
                            <button
                              onClick={() => handleRSVP("NO")}
                              disabled={loading}
                              style={{
                                padding: "13px 22px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, var(--blue), var(--blue-mid))",
                                color: "white",
                                fontSize: "14px",
                                fontWeight: 800,
                                border: "none",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "var(--font-primary)",
                                boxShadow: "0 4px 14px rgba(27,79,138,.28)",
                                transition: "all .2s",
                                whiteSpace: "nowrap",
                                opacity: loading ? 0.7 : 1,
                              }}
                            >
                              ✅ You're Going!
                            </button>
                            <button
                              onClick={() => handleRSVP("NO")}
                              disabled={loading}
                              style={{
                                padding: "13px 18px",
                                borderRadius: "12px",
                                border: "1.5px solid var(--border)",
                                background: "white",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "var(--muted)",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "var(--font-primary)",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setShowRSVPModal(true)}
                            disabled={loading}
                            style={{
                              padding: "13px 22px",
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                              color: "white",
                              fontSize: "14px",
                              fontWeight: 800,
                              border: "none",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontFamily: "var(--font-primary)",
                              boxShadow: "0 4px 14px rgba(27,107,69,.28)",
                              transition: "all .2s",
                              whiteSpace: "nowrap",
                              opacity: loading ? 0.7 : 1,
                            }}
                          >
                            ✅ RSVP Free
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => router.push("/auth/signin?callback=" + encodeURIComponent(window.location.pathname))}
                        style={{
                          padding: "13px 22px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-primary)",
                          boxShadow: "0 4px 14px rgba(27,107,69,.28)",
                          transition: "all .2s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Sign in to RSVP
                      </button>
                    )}
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
                {!isGlobal && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, var(--gold-light), #FEF3C7)",
                      border: "1.5px solid rgba(201,146,10,.28)",
                      borderRadius: "10px",
                      padding: "11px 13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div style={{ fontSize: "20px" }}>🔔</div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--gold)",
                        lineHeight: 1.5,
                      }}
                    >
                      Pinned to <strong>{event.community?.name || "Community Circle"}</strong>.{" "}
                      <span
                        style={{
                          color: "var(--blue)",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        View in your circle feed →
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* About Section */}
            {event.description && (
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
                  <span style={{ fontSize: "18px" }}>{getEventEmoji()}</span> About This Event
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    marginBottom: "10px",
                  }}
                >
                  {event.description}
                </div>
              </div>
            )}

            {/* Schedule */}
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
                <span style={{ fontSize: "18px" }}>📅</span> Event Schedule
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
                    {getEventEmoji()}
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", paddingTop: "4px" }}>
                      {formattedDate}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                      {event.location || "Location TBD"} · {time}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            {event.location && (
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
                  <span style={{ fontSize: "18px" }}>📍</span> Venue
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
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
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
                    {event.location}
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
                    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`;
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
                  🗺️ Get Directions to {event.location.split(",")[0]}
                </button>
              </div>
            )}

            {/* Who's Going */}
            {event.rsvps && event.rsvps.length > 0 && (
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
                  <span style={{ fontSize: "18px" }}>🙋</span> Who's Going
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {event.rsvps.slice(0, 3).map((rsvp: any) => {
                    const user = rsvp.user || {};
                    const userInitials = (user.name || "U")
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={rsvp.id}
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
                          {userInitials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {user.name || "Anonymous"}
                            {user.profile?.trustScore && user.profile.trustScore >= 100 && (
                              <span
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
                                  marginLeft: "5px",
                                }}
                              >
                                🌟 Top Helper
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                            {user.profile?.nativePlaceState || ""} · {user.profile?.currentCity || ""}
                            {user.profile?.trustScore && ` · Trust Score ${user.profile.trustScore}`}
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
                        >
                          + Connect
                        </button>
                      </div>
                    );
                  })}
                </div>
                {rsvpCount > 3 && (
                  <div
                    style={{
                      marginTop: "13px",
                      textAlign: "center",
                      fontSize: "12px",
                      color: "var(--blue)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    View all {rsvpCount} attendees →
                  </div>
                )}
              </div>
            )}

            {/* Organizer */}
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
                <span style={{ fontSize: "18px" }}>🤝</span> Organiser
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "11px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "var(--gold-light)",
                    border: "1px solid rgba(201,146,10,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {getStateEmoji(creator.profile?.nativePlaceState || "")}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
                    {event.community?.name || creator.name || "Organizer"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                    Community Organisation · {creator.profile?.currentCity || "City"}
                  </div>
                </div>
              </div>
              {event.description && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    marginBottom: "13px",
                  }}
                >
                  {event.community?.name || creator.name || "Organizer"} serves the community. We organise cultural events, job fairs, and welfare drives throughout the year.
                </div>
              )}
              <Link
                href={event.community ? `/community/${event.community.id}` : `/profile/${creator.id}`}
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
                View Organiser Profile →
              </Link>
            </div>

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
                {event.title?.toLowerCase().includes("puja") && (
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
                    Chhath Puja
                  </div>
                )}
                {!isGlobal && creator.profile?.nativePlaceState && (
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
                    {creator.profile.nativePlaceState} Circle
                  </div>
                )}
                {isGlobal && (
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
                    Community Event
                  </div>
                )}
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
                  Free Entry
                </div>
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
                  Family Friendly
                </div>
                {event.location && (
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
                    {event.location.split(",")[0]}
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
                  Cultural
                </div>
              </div>
            </div>

            {/* Similar Events */}
            {similarEvents.length > 0 && (
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
                  <span style={{ fontSize: "18px" }}>🔍</span> More Events Near You
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {similarEvents.map((similarEvent) => {
                    const similarDate = new Date(similarEvent.startsAt);
                    return (
                      <Link
                        key={similarEvent.id}
                        href={`/events/${similarEvent.id}`}
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
                            background: "var(--green-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            flexShrink: 0,
                          }}
                        >
                          🎉
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
                            {similarEvent.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                            {similarEvent.community?.name || similarEvent.creator?.name || "Community"} · {similarDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {similarEvent.location || "Location TBD"}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--green)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Free
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "118px" }}>
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
                RSVP for this Event
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "14px" }}>
                {event.title} · {month} {day} · {time}
              </div>
              {isAuthenticated ? (
                <>
                  {rsvpStatus === "YES" ? (
                    <button
                      onClick={() => handleRSVP("NO")}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "13px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 800,
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "9px",
                        transition: "all .2s",
                        background: "linear-gradient(135deg, var(--blue), var(--blue-mid))",
                        color: "white",
                        boxShadow: "0 4px 14px rgba(27,79,138,.28)",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      ✅ You're Going!
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowRSVPModal(true)}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "13px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 800,
                        border: "none",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "9px",
                        transition: "all .2s",
                        background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                        color: "white",
                        boxShadow: "0 4px 14px rgba(27,107,69,.28)",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      ✅ Confirm RSVP — Free
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => router.push("/auth/signin?callback=" + encodeURIComponent(window.location.pathname))}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginBottom: "9px",
                    transition: "all .2s",
                    background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(27,107,69,.28)",
                  }}
                >
                  Sign in to RSVP
                </button>
              )}
              {event.capacity && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--muted)",
                    marginTop: "10px",
                    padding: "8px 10px",
                    background: "var(--cream)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--green)",
                    }}
                  />
                  {remainingSpots} spots remaining · {rsvpCount} people going
                </div>
              )}
            </div>

            {/* Organizer Card */}
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
                    background: "var(--gold-light)",
                    border: "1px solid rgba(201,146,10,.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {getStateEmoji(creator.profile?.nativePlaceState || "")}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--ink)" }}>
                    {event.community?.name || creator.name || "Organizer"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                    Community Organisation · {creator.profile?.currentCity || "City"}
                  </div>
                </div>
              </div>
              <Link
                href={event.community ? `/community/${event.community.id}` : `/profile/${creator.id}`}
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
                View Profile →
              </Link>
            </div>

            {/* Trust Card */}
            <div
              style={{
                borderRadius: "14px",
                padding: "16px 18px",
                background: "var(--green-light)",
                border: "1px solid rgba(27,107,69,.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ fontSize: "20px" }}>✅</div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--green)" }}>
                  Community-Verified Event
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
                  Organiser verified by {event.community?.name || "community"} moderators
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
                  Venue confirmed — access permitted
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
                  Previous events with high ratings
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
                  Reminder notification 24 hrs before event
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
                📤 Spread the word
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

      {/* RSVP Modal */}
      {showRSVPModal && (
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRSVPModal(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px 20px 0 0",
              width: "100%",
              maxWidth: "580px",
              padding: "22px 26px 34px",
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
              Confirm Your RSVP
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "18px" }}>
              You'll receive a reminder 24 hours before the event
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "12px 14px",
                background: "var(--green-light)",
                borderRadius: "10px",
                border: "1px solid rgba(27,107,69,.15)",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "26px" }}>{getEventEmoji()}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--ink)" }}>
                  {event.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "1px" }}>
                  {month} {day} · {time} · {event.location || "Location TBD"}
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
                }}
              >
                Number of people attending
              </div>
              <select
                value={rsvpForm.attendees}
                onChange={(e) => setRsvpForm((prev) => ({ ...prev, attendees: e.target.value }))}
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
                <option value="1">Just me (1 person)</option>
                <option value="2">Me + 1 guest (2 people)</option>
                <option value="3">Family (3–4 people)</option>
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
                Need community bus? <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)" }}>Optional</span>
              </div>
              <select
                value={rsvpForm.transport}
                onChange={(e) => setRsvpForm((prev) => ({ ...prev, transport: e.target.value }))}
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
                <option value="none">No, arranging own transport</option>
                <option value="swargate">Yes — from Swargate</option>
                <option value="hadapsar">Yes — from Hadapsar</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button
                onClick={() => setShowRSVPModal(false)}
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
                onClick={() => handleRSVP("YES")}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: "11px",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-primary)",
                  background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                  color: "white",
                  boxShadow: "0 3px 10px rgba(27,107,69,.25)",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Confirming..." : "✅ Confirm RSVP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { CommunityPostType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SOSCard from "./SOSCard";
import NewMemberWelcomeCard from "./NewMemberWelcomeCard";
import MeetupCard from "./MeetupCard";
import GyaanEntry from "./GyaanEntry";
import ConnectButton from "../ConnectButton";

type FeedPostProps = {
  post: {
    id: string;
    type: CommunityPostType;
    content: string;
    mediaUrls?: string[];
    author: {
      id: string;
      name: string | null;
      image?: string | null;
      profile?: {
        nativePlaceState?: string | null;
        trustScore?: number;
      } | null;
    };
    likeCount: number;
    replyCount: number;
    createdAt: Date | string;
    isPinned: boolean;
    sos?: any;
    meetup?: any;
    gyaanEntry?: any;
    eventId?: string | null;
    jobPostId?: string | null;
    event?: any;
    jobPost?: any;
    _count?: {
      likes: number;
      replies: number;
    };
    likes?: Array<{ id: string }>;
  };
  onLike?: (postId: string) => void;
  onReply?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string) => void;
  isLiked?: boolean;
};

export default function FeedPost({
  post,
  onLike,
  onReply,
  onShare,
  onReport,
  isLiked = false,
}: FeedPostProps) {
  const router = useRouter();
  // Delegate to specialized components
  if (post.type === CommunityPostType.SOS && post.sos) {
    return (
      <SOSCard
        sos={{
          ...post.sos,
          content: post.content,
          requester: {
            name: post.author.name,
            state: post.author.profile?.nativePlaceState,
            trustScore: post.author.profile?.trustScore || 0,
          },
          responseCount: post.replyCount || post._count?.replies || 0,
        }}
        onRespond={(sosId) => {
          console.log("Respond to SOS", sosId);
        }}
      />
    );
  }

  if (post.type === CommunityPostType.WELCOME) {
    return (
      <NewMemberWelcomeCard
        member={{
          id: post.id,
          name: post.author.name || "",
          nativeDistrict: post.author.profile?.nativePlaceState || "",
          occupation: "",
          profilePhotoUrl: post.author.image || "",
          joinedAt: post.createdAt,
          skills: [],
        }}
        onWelcome={() => {}}
        onConnect={() => {}}
      />
    );
  }

  if (post.type === CommunityPostType.MEETUP && post.meetup) {
    return <MeetupCard meetup={post.meetup} post={post} />;
  }

  if (post.type === CommunityPostType.GYAAN && post.gyaanEntry) {
    return <GyaanEntry entry={post.gyaanEntry} post={post} />;
  }

  // Get post type badge
  const getTypeBadge = () => {
    switch (post.type) {
      case CommunityPostType.JOB_SHARE:
        return { label: "💼 Job", bg: "var(--blue-light)", color: "var(--blue)" };
      case CommunityPostType.EVENT_SHARE:
        return { label: "🎉 Event", bg: "var(--green-light)", color: "var(--green)" };
      case CommunityPostType.GENERAL:
        return { label: "🔧 Service", bg: "var(--gold-light)", color: "var(--gold)" };
      default:
        return null;
    }
  };

  const typeBadge = getTypeBadge();
  const authorName = post.author.name || "Anonymous";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const state = post.author.profile?.nativePlaceState || "";
  const trustScore = post.author.profile?.trustScore || 0;
  const isVerified = trustScore >= 100;

  const getStateEmoji = (state: string) => {
    switch (state) {
      case "Odisha":
        return "🌊";
      case "Uttar Pradesh":
        return "🏛️";
      case "Odisha":
        return "🌊";
      case "West Bengal":
        return "🐯";
      case "Rajasthan":
        return "🏜️";
      default:
        return "📍";
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

  // Extract job details from content if it's a job post
  const extractJobDetails = (content: string) => {
    const details: any = {};
    const lines = content.split("\n");
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes("₹") || lower.includes("pay") || lower.includes("salary")) {
        const match = line.match(/₹[\d,]+/);
        if (match) details.pay = match[0];
      }
      if (lower.includes("location") || lower.includes("in ")) {
        const match = line.match(/(?:location|in)\s*:?\s*([^,\.]+)/i);
        if (match) details.location = match[1].trim();
      }
      if (lower.includes("duration") || lower.includes("month")) {
        const match = line.match(/(\d+)\s*(?:month|week|day)/i);
        if (match) details.duration = match[0];
      }
      if (lower.includes("language") || lower.includes("hindi") || lower.includes("bhojpuri")) {
        const langs: string[] = [];
        if (lower.includes("hindi")) langs.push("Hindi");
        if (lower.includes("bhojpuri")) langs.push("Bhojpuri");
        if (lower.includes("marathi")) langs.push("Marathi");
        if (langs.length > 0) details.language = langs.join(" / ");
      }
      if (
        lower.includes("housing included") ||
        lower.includes("housing provided") ||
        lower.includes("room provided") ||
        lower.includes("accommodation") ||
        lower.includes("stay provided")
      ) {
        details.housingIncluded = true;
      }
    });
    return details;
  };

  const jobDetails = post.type === CommunityPostType.JOB_SHARE ? extractJobDetails(post.content) : null;

  const hasHousingIncluded = !!jobDetails?.housingIncluded;

  // Get event/job ID for navigation
  const getDetailLink = () => {
    if (post.type === CommunityPostType.EVENT_SHARE && post.meetup) {
      // For events, we need to find the Event by matching title/date
      // For now, we'll use a search approach or store eventId in meetup
      return null; // Will be handled by clicking the card
    }
    if (post.type === CommunityPostType.JOB_SHARE) {
      // For jobs, we need to find the JobPost by matching title/content
      // For now, we'll use a search approach
      return null; // Will be handled by clicking the card
    }
    return null;
  };

  const handleCardClick = () => {
    if (post.type === CommunityPostType.EVENT_SHARE || post.type === CommunityPostType.MEETUP) {
      // Try multiple sources for event ID
      const eventId = post.eventId || post.event?.id || post.meetup?.eventId;
      
      if (eventId) {
        router.push(`/events/${eventId}`);
      } else {
        // Fallback: search by title
        const title = post.meetup?.title || post.content?.split('\n')[0] || post.content?.slice(0, 30);
        router.push(`/events?search=${encodeURIComponent(title || "")}`);
      }
    } else if (post.type === CommunityPostType.JOB_SHARE) {
      if (post.jobPostId && post.jobPost) {
        router.push(`/jobs/${post.jobPostId}`);
      } else {
        // Fallback: navigate to jobs page with filters
        if (state || jobDetails?.location) {
          const params = new URLSearchParams();
          if (state) params.set("state", state);
          if (jobDetails?.location) params.set("q", jobDetails.location);
          router.push(`/jobs?${params.toString()}`);
        } else {
          router.push("/jobs");
        }
      }
    }
  };

  // Get post type accent color
  const getPostAccent = () => {
    switch (post.type) {
      case CommunityPostType.SOS:
        return { borderTop: "3px solid var(--coral)", ringColor: "var(--coral)" };
      case CommunityPostType.GYAAN:
        return { borderTop: "3px solid var(--amber)", ringColor: "var(--amber)" };
      case CommunityPostType.MEETUP:
        return { borderTop: "3px solid var(--teal)", ringColor: "var(--teal)" };
      case CommunityPostType.JOB_SHARE:
        return { borderTop: "3px solid var(--royal)", ringColor: "var(--royal)" };
      case CommunityPostType.EVENT_SHARE:
        return { borderTop: "3px solid var(--purple)", ringColor: "var(--purple)" };
      default:
        return { borderTop: "none", ringColor: "transparent" };
    }
  };

  const accent = getPostAccent();

  return (
    <div
      className="bg-white rounded-2xl border transition-all"
      style={{
        borderRadius: "18px",
        border: "1.5px solid var(--fog)",
        borderTop: accent.borderTop,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
        cursor: (post.type === CommunityPostType.EVENT_SHARE || post.type === CommunityPostType.MEETUP || post.type === CommunityPostType.JOB_SHARE) ? "pointer" : "default",
        animation: "cardIn 0.35s ease both",
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(43,79,212,.18)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--fog)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Post Header - Matching Design */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "11px",
          padding: "14px 16px 10px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: 900,
            color: "white",
            flexShrink: 0,
            position: "relative",
            background: "linear-gradient(135deg, var(--royal-dark), var(--royal))",
          }}
        >
          {initials}
          {(post.type === CommunityPostType.SOS || post.type === CommunityPostType.GYAAN) && (
            <div
              style={{
                position: "absolute",
                inset: "-2px",
                borderRadius: "14px",
                border: `2px solid ${accent.ringColor}`,
              }}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.2px",
            }}
          >
            {authorName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginTop: "3px",
              flexWrap: "wrap",
            }}
          >
            {state && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  fontSize: "9px",
                  fontWeight: 800,
                  background: post.type === CommunityPostType.SOS ? "var(--coral-light)" : "var(--amber-light)",
                  color: post.type === CommunityPostType.SOS ? "var(--coral-dark)" : "var(--amber-dark)",
                }}
              >
                {getStateEmoji(state)} {state}
              </div>
            )}
            <div
              style={{
                width: "3px",
                height: "3px",
                borderRadius: "50%",
                background: "var(--fog)",
              }}
            />
            <div
              style={{
                fontSize: "10px",
                color: "var(--mist)",
                fontWeight: 500,
              }}
            >
              {post.type === CommunityPostType.JOB_SHARE && "Construction Worker"}
              {post.type === CommunityPostType.EVENT_SHARE && "Community Leader"}
              {post.type === CommunityPostType.GENERAL && "Service Provider"}
              {post.type === CommunityPostType.SOS && "Worker"}
              {post.type === CommunityPostType.GYAAN && "Verified Helper"}
            </div>
            <div
              style={{
                width: "3px",
                height: "3px",
                borderRadius: "50%",
                background: "var(--fog)",
              }}
            />
            <div
              style={{
                fontSize: "10px",
                color: "var(--mist)",
              }}
            >
              {getTimeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        {typeBadge && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "100px",
              fontSize: "10px",
              fontWeight: 800,
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: post.type === CommunityPostType.SOS ? "var(--coral-light)" : post.type === CommunityPostType.GYAAN ? "var(--amber-light)" : post.type === CommunityPostType.MEETUP ? "var(--teal-light)" : post.type === CommunityPostType.JOB_SHARE ? "var(--royal-light)" : "var(--purple-light)",
              color: post.type === CommunityPostType.SOS ? "var(--coral-dark)" : post.type === CommunityPostType.GYAAN ? "var(--amber-dark)" : post.type === CommunityPostType.MEETUP ? "var(--teal)" : post.type === CommunityPostType.JOB_SHARE ? "var(--royal)" : "var(--purple)",
            }}
          >
            {typeBadge.label}
          </div>
        )}
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "7px",
            background: "var(--cloud)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            cursor: "pointer",
            color: "var(--mist)",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--fog)";
            e.currentTarget.style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cloud)";
            e.currentTarget.style.color = "var(--mist)";
          }}
        >
          ⋯
        </div>
      </div>

      {/* Post Body - Matching Design */}
      <div
        style={{
          padding: "0 16px 12px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "var(--ink)",
            lineHeight: 1.7,
            fontWeight: 500,
          }}
        >
          {post.content.split("\n").map((line, idx) => {
            const isBold = line.includes("**") || line.match(/^\d+\s+(experienced|month|year)/i);
            const hasHighlight = line.match(/<span class="highlight">(.*?)<\/span>/);
            return (
              <span key={idx}>
                {isBold ? (
                  <strong style={{ color: "var(--ink)", fontWeight: 700 }}>{line.replace(/\*\*/g, "")}</strong>
                ) : hasHighlight ? (
                  <span
                    style={{
                      background: "linear-gradient(135deg, var(--amber-light), #FFF0CC)",
                      color: "var(--amber-dark)",
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    {line.replace(/<span class="highlight">(.*?)<\/span>/g, "$1")}
                  </span>
                ) : (
                  line
                )}
                {idx < post.content.split("\n").length - 1 && <br />}
              </span>
            );
          })}
        </div>
      </div>

      {/* Context Card for Service/Event/Job - Matching Design */}
      {(post.type === CommunityPostType.JOB_SHARE || post.type === CommunityPostType.EVENT_SHARE || post.type === CommunityPostType.GENERAL) && (
        <div
          style={{
            margin: "8px 16px 12px",
            borderRadius: "12px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "1.5px solid",
            background: post.type === CommunityPostType.JOB_SHARE ? "var(--royal-xlight)" : post.type === CommunityPostType.EVENT_SHARE ? "var(--purple-light)" : "var(--royal-xlight)",
            borderColor: post.type === CommunityPostType.JOB_SHARE ? "rgba(43,79,212,.12)" : post.type === CommunityPostType.EVENT_SHARE ? "rgba(124,58,237,.12)" : "rgba(43,79,212,.12)",
          }}
        >
          <div style={{ fontSize: "22px", flexShrink: 0 }}>
            {post.type === CommunityPostType.JOB_SHARE ? "💼" : post.type === CommunityPostType.EVENT_SHARE ? "🎉" : "🔧"}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "2px",
                color: post.type === CommunityPostType.JOB_SHARE ? "var(--royal)" : post.type === CommunityPostType.EVENT_SHARE ? "var(--purple)" : "var(--royal)",
              }}
            >
              {post.type === CommunityPostType.JOB_SHARE ? "Job Listing" : post.type === CommunityPostType.EVENT_SHARE ? "Community Event" : "Service Listing"}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "var(--ink)",
              }}
            >
              {post.type === CommunityPostType.JOB_SHARE && jobDetails
                ? `${jobDetails.pay || "Competitive"} · ${jobDetails.location || "Location TBD"}`
                : post.type === CommunityPostType.EVENT_SHARE
                ? post.content.split("\n")[0]?.slice(0, 40) || "Event"
                : post.content.split("\n")[0]?.slice(0, 40) || "Service"}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--slate)",
                marginTop: "2px",
              }}
            >
              {post.type === CommunityPostType.JOB_SHARE
                ? `${state || "Odisha"} community rate`
                : post.type === CommunityPostType.EVENT_SHARE
                ? "Free entry · 43 going"
                : `${state || "Odisha"} · Community rate`}
            </div>
          </div>
          <button
            style={{
              padding: "7px 13px",
              borderRadius: "9px",
              fontSize: "11px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s",
              background: post.type === CommunityPostType.JOB_SHARE ? "var(--royal)" : post.type === CommunityPostType.EVENT_SHARE ? "var(--purple)" : "var(--royal)",
              color: "white",
              boxShadow: post.type === CommunityPostType.JOB_SHARE ? "0 2px 8px rgba(43,79,212,.22)" : post.type === CommunityPostType.EVENT_SHARE ? "0 2px 8px rgba(124,58,237,.22)" : "0 2px 8px rgba(43,79,212,.22)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            {post.type === CommunityPostType.JOB_SHARE ? "Apply" : post.type === CommunityPostType.EVENT_SHARE ? "RSVP" : "Inquire"}
          </button>
        </div>
      )}

      {/* Image Grid - Matching Design */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (() => {
        const mediaUrls = post.mediaUrls;
        return (
          <div
            style={{
              margin: "0 0 0",
              display: "grid",
              gap: "3px",
              gridTemplateColumns:
                mediaUrls.length === 1
                  ? "1fr"
                  : mediaUrls.length === 2
                  ? "1fr 1fr"
                  : "1fr 1fr",
              gridTemplateRows: mediaUrls.length === 3 ? "auto auto" : "auto",
            }}
          >
            {mediaUrls.slice(0, 3).map((url, index) => (
              <div
                key={index}
                style={{
                  background: "var(--cloud)",
                  overflow: "hidden",
                  position: "relative",
                  height: mediaUrls.length === 1 ? "200px" : index === 0 && mediaUrls.length === 3 ? "160px" : "110px",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(url, "_blank");
                }}
              >
                <img
                  src={url}
                  alt={`Post image ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {mediaUrls.length > 3 && index === 2 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(13,19,64,.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 900,
                      color: "white",
                    }}
                  >
                    +{mediaUrls.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Job Details Section */}
      {post.type === CommunityPostType.JOB_SHARE && jobDetails && (
        <div
          className="rounded-xl p-3.5 mb-3 grid gap-2.5"
          style={{
            background: "var(--blue-light)",
            borderRadius: "10px",
            padding: "11px 14px",
            marginBottom: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            border: "1px solid rgba(27,79,138,0.08)",
          }}
        >
          {jobDetails.pay && (
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "var(--blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                PAY
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--green)",
                }}
              >
                {jobDetails.pay}/mo
              </div>
            </div>
          )}
          {jobDetails.location && (
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "var(--blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                LOCATION
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {jobDetails.location}
              </div>
            </div>
          )}
          {jobDetails.duration && (
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "var(--blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                DURATION
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {jobDetails.duration}
              </div>
            </div>
          )}
          {jobDetails.language && (
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "var(--blue)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                LANGUAGE
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {jobDetails.language}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.type === CommunityPostType.JOB_SHARE && (
        <div className="flex gap-1.5 flex-wrap mb-3" style={{ marginTop: "10px" }}>
          {jobDetails?.language && (
            <span
              className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{
                padding: "3px 9px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                background: "var(--gold-light)",
                color: "var(--gold)",
                border: "1px solid rgba(201,146,10,0.2)",
              }}
            >
              🗣️ {jobDetails.language}
            </span>
          )}
          {hasHousingIncluded && (
            <span
              className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{
                padding: "3px 9px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                background: "var(--green-light)",
                color: "var(--green)",
                border: "1px solid rgba(27,107,69,0.15)",
              }}
            >
              🏠 Housing Included
            </span>
          )}
          {state && (
            <span
              className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{
                padding: "3px 9px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                background: "var(--saffron)",
                color: "white",
                border: "1px solid var(--saffron)",
              }}
            >
              {getStateEmoji(state)} {state} Employer
            </span>
          )}
        </div>
      )}

      {/* Reactions Row - Matching Design */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 16px 8px",
          borderTop: "1px solid rgba(226,232,240,.6)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--cloud)",
            borderRadius: "100px",
            padding: "3px 9px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--slate)",
            cursor: "pointer",
            transition: "all 0.15s",
            border: "1.5px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--royal-light)";
            e.currentTarget.style.color = "var(--royal)";
            e.currentTarget.style.borderColor = "rgba(43,79,212,.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cloud)";
            e.currentTarget.style.color = "var(--slate)";
            e.currentTarget.style.borderColor = "transparent";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(post.id);
          }}
        >
          👍 <span style={{ fontSize: "11px" }}>{post.likeCount || post._count?.likes || 0}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--cloud)",
            borderRadius: "100px",
            padding: "3px 9px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--slate)",
            cursor: "pointer",
            transition: "all 0.15s",
            border: "1.5px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--royal-light)";
            e.currentTarget.style.color = "var(--royal)";
            e.currentTarget.style.borderColor = "rgba(43,79,212,.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cloud)";
            e.currentTarget.style.color = "var(--slate)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          ❤️ <span style={{ fontSize: "11px" }}>5</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--cloud)",
            borderRadius: "100px",
            padding: "3px 9px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--slate)",
            cursor: "pointer",
            transition: "all 0.15s",
            border: "1.5px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--royal-light)";
            e.currentTarget.style.color = "var(--royal)";
            e.currentTarget.style.borderColor = "rgba(43,79,212,.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cloud)";
            e.currentTarget.style.color = "var(--slate)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          🙌 <span style={{ fontSize: "11px" }}>3</span>
        </div>
      </div>

      {/* Post Footer Actions - Matching Design */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 10px 10px",
          gap: "2px",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(post.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flex: 1,
            justifyContent: "center",
            padding: "8px 6px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            color: isLiked ? "var(--saffron-dark)" : "var(--mist)",
            transition: "all 0.15s",
            border: "none",
            background: isLiked ? "var(--saffron-light)" : "transparent",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!isLiked) {
              e.currentTarget.style.background = "var(--cloud)";
              e.currentTarget.style.color = "var(--ink)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLiked) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--mist)";
            }
          }}
        >
          👍 {isLiked ? "Liked" : "Like"}
        </button>
        <div
          style={{
            width: "1px",
            height: "24px",
            background: "var(--fog)",
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReply?.(post.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flex: 1,
            justifyContent: "center",
            padding: "8px 6px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--mist)",
            transition: "all 0.15s",
            border: "none",
            background: "transparent",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--cloud)";
            e.currentTarget.style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--mist)";
          }}
        >
          💬 {post.replyCount || post._count?.replies || 0} Replies
        </button>
        <div
          style={{
            width: "1px",
            height: "24px",
            background: "var(--fog)",
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare?.(post.id);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flex: 1,
            justifyContent: "center",
            padding: "8px 6px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--mist)",
            transition: "all 0.15s",
            border: "none",
            background: "transparent",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--cloud)";
            e.currentTarget.style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--mist)";
          }}
        >
          🔗 Share
        </button>
      </div>
    </div>
  );
}

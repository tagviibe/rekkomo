"use client";

import { CommunityPostType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SOSCard from "./SOSCard";
import NewMemberWelcomeCard from "./NewMemberWelcomeCard";
import MeetupCard from "./MeetupCard";
import GyaanEntry from "./GyaanEntry";

type FeedPostProps = {
  post: {
    id: string;
    type: CommunityPostType;
    content: string;
    mediaUrls?: string[];
    author: {
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
  };
  onLike?: (postId: string) => void;
  onReply?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string) => void;
};

export default function FeedPost({
  post,
  onLike,
  onReply,
  onShare,
  onReport,
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
      case "Bihar":
        return "🌾";
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

  return (
    <div
      className="bg-white rounded-2xl border p-4.5 mb-3 transition-all"
      style={{
        borderColor: "var(--border)",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "12px",
        boxShadow: "var(--shadow-sm)",
        cursor: (post.type === CommunityPostType.EVENT_SHARE || post.type === CommunityPostType.MEETUP || post.type === CommunityPostType.JOB_SHARE) ? "pointer" : "default",
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "rgba(232,98,26,0.15)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9.5 h-9.5 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{
            width: "38px",
            height: "38px",
            background: "linear-gradient(135deg, var(--blue) 0%, var(--blue-mid) 100%)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {authorName}
            </span>
            {isVerified && (
              <span style={{ color: "var(--green)", fontSize: "12px" }}>✅</span>
            )}
            {state && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: "var(--gold-light)",
                  color: "var(--gold)",
                  border: "1px solid rgba(201,146,10,0.2)",
                }}
              >
                {state === "Bihar" ? "🌾" : state === "Uttar Pradesh" ? "🏛️" : "📍"} {state}
              </span>
            )}
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              {getTimeAgo(post.createdAt)}
            </span>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {post.type === CommunityPostType.JOB_SHARE && "Construction Contractor"}
            {post.type === CommunityPostType.EVENT_SHARE && "Event Organizer"}
            {post.type === CommunityPostType.GENERAL && "Service Provider"}
          </div>
        </div>
        {typeBadge && (
          <span
            className="px-2.5 py-1.5 rounded-md text-xs font-bold"
            style={{
              background: typeBadge.bg,
              color: typeBadge.color,
              padding: "3px 10px",
              borderRadius: "7px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {typeBadge.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          fontSize: "13px",
          lineHeight: 1.65,
          color: "var(--muted)",
          marginBottom: post.type === CommunityPostType.JOB_SHARE ? "13px" : "13px",
        }}
      >
        {post.content.split("\n").map((line, idx) => {
          const isBold = line.includes("**") || line.match(/^\d+\s+(experienced|month|year)/i);
          return (
            <span key={idx}>
              {isBold ? (
                <strong style={{ color: "var(--ink)", fontWeight: 700 }}>{line.replace(/\*\*/g, "")}</strong>
              ) : (
                line
              )}
              {idx < post.content.split("\n").length - 1 && <br />}
            </span>
          );
        })}
      </div>

      {/* Images */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div
          className="mt-3 mb-3"
          style={{
            marginTop: "12px",
            marginBottom: "12px",
          }}
        >
          <div
            className="grid gap-2"
            style={{
              display: "grid",
              gridTemplateColumns:
                post.mediaUrls.length === 1
                  ? "1fr"
                  : post.mediaUrls.length === 2
                  ? "1fr 1fr"
                  : "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {post.mediaUrls.slice(0, 9).map((url, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden"
                style={{
                  aspectRatio: "1",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Open image in new tab or modal
                  window.open(url, "_blank");
                }}
              >
                <img
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-full object-cover"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={() => onLike?.(post.id)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none"
          style={{
            background: "var(--cream)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 13px",
            borderRadius: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--saffron-light)";
            e.currentTarget.style.color = "var(--saffron)";
            e.currentTarget.style.borderColor = "rgba(232,98,26,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cream)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          👍 {post.likeCount || post._count?.likes || 0}
        </button>
        <button
          onClick={() => onReply?.(post.id)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none"
          style={{
            background: "var(--cream)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 13px",
            borderRadius: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--saffron-light)";
            e.currentTarget.style.color = "var(--saffron)";
            e.currentTarget.style.borderColor = "rgba(232,98,26,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cream)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          💬 {post.replyCount || post._count?.replies || 0}
        </button>
        <button
          onClick={() => onShare?.(post.id)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none"
          style={{
            background: "var(--cream)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 13px",
            borderRadius: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--saffron-light)";
            e.currentTarget.style.color = "var(--saffron)";
            e.currentTarget.style.borderColor = "rgba(232,98,26,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--cream)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          🔗 Share
        </button>
        {post.type === CommunityPostType.JOB_SHARE && (
          <button
            className="sm:ml-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all border-none w-full sm:w-auto"
            style={{
              background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
              fontSize: "12px",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: "9px",
              boxShadow: "0 2px 8px rgba(232,98,26,0.22)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (state || jobDetails?.location) {
                const params = new URLSearchParams();
                if (state) params.set("state", state);
                if (jobDetails?.location) params.set("q", jobDetails.location);
                router.push(`/jobs?${params.toString()}`);
              } else {
                router.push("/jobs");
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(232,98,26,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(232,98,26,0.22)";
            }}
          >
            Apply Now →
          </button>
        )}
        {post.type === CommunityPostType.EVENT_SHARE && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (post.eventId) {
                router.push(`/events/${post.eventId}`);
              } else if (post.meetup?.eventId) {
                router.push(`/events/${post.meetup.eventId}`);
              } else {
                router.push(`/events?search=${encodeURIComponent(post.content.split('\n')[0])}`);
              }
            }}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all border-none"
            style={{
              background: "linear-gradient(135deg, var(--green), var(--green-dark))",
              fontSize: "12px",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: "9px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            View Details →
          </button>
        )}
        {post.type === CommunityPostType.GENERAL && (
          <button
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all border-none"
            style={{
              background: "linear-gradient(135deg, var(--gold), #A67206)",
              fontSize: "12px",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: "9px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Contact →
          </button>
        )}
      </div>
    </div>
  );
}

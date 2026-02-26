"use client";

import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineHeart,
  HiOutlineBookmark,
  HiOutlineShare,
  HiOutlineFlag,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";

type FeedCardProps = {
  id: string;
  title: string;
  body: string;
  type: "job" | "event" | "service" | "help" | "housing";
  imageUrl?: string | null;
  location?: string | null;
  community?: string | null;
  author?: {
    id: string;
    name: string | null;
    image?: string | null;
  };
  createdAt: string;
  _count?: {
    comments: number;
    reactions: number;
  };
  // Job-specific
  payMin?: number | null;
  payMax?: number | null;
  skillCategory?: string | null;
  languagePref?: string[];
  // Event-specific
  startsAt?: string | null;
  endsAt?: string | null;
  rsvpCount?: number;
  capacity?: number | null;
  // Service-specific
  serviceCategory?: string | null;
  rate?: number | null;
  onComment?: () => void;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onReport?: () => void;
};

export default function FeedCard({
  id,
  title,
  body,
  type,
  imageUrl,
  location,
  community,
  author,
  createdAt,
  _count,
  payMin,
  payMax,
  skillCategory,
  languagePref,
  startsAt,
  endsAt,
  rsvpCount,
  capacity,
  serviceCategory,
  rate,
  onComment,
  onLike,
  onSave,
  onShare,
  onReport,
}: FeedCardProps) {
  const getBadge = () => {
    switch (type) {
      case "job":
        return { label: "Job", className: "badge-job" };
      case "event":
        return { label: "Event", className: "badge-event" };
      case "service":
        return { label: "Service", className: "badge-service" };
      case "housing":
        return { label: "Housing", className: "badge-service" };
      default:
        return { label: "Help", className: "badge-royal" };
    }
  };

  const getIcon = () => {
    switch (type) {
      case "job":
        return HiOutlineBriefcase;
      case "event":
        return HiOutlineSparkles;
      case "service":
        return HiOutlineWrenchScrewdriver;
      default:
        return HiOutlineUsers;
    }
  };

  const badge = getBadge();
  const Icon = getIcon();

  return (
    <article 
      className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-fog)] p-5 mb-3 transition-all cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--color-primary-light)] hover:-translate-y-0.5"
    >
      {/* Header with Author */}
      <div className="flex items-start gap-3 mb-3">
        {author ? (
          <>
            {author.image ? (
              <Image
                src={author.image}
                alt={author.name || "Author"}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-mid), var(--color-primary))'
                }}
              >
                {(author.name || "A")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{author.name || "Member"}</p>
                <span className={badge.className}>{badge.label}</span>
                {type === "job" && skillCategory && (
                  <span className="text-xs font-semibold text-[var(--color-slate)]">
                    {skillCategory}
                  </span>
                )}
                {type === "event" && startsAt && (
                  <span className="text-xs font-semibold text-[var(--color-slate)]">
                    {new Date(startsAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {type === "service" && serviceCategory && (
                  <span className="text-xs font-semibold text-[var(--color-slate)]">
                    {serviceCategory}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-slate)] mt-1">
                <span>{new Date(createdAt).toLocaleDateString()}</span>
                {location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HiOutlineMapPin className="text-[var(--color-mist)]" />
                      {location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <span className={badge.className}>{badge.label}</span>
            <span className="text-xs text-[var(--color-mist)] ml-auto">
              {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Title & Body */}
      <Link href={`/posts/${id}`} className="block mb-3 no-underline">
        <h2 className="text-base font-bold text-[var(--color-ink)] mb-2 leading-snug">{title}</h2>
        <p className="text-sm text-[var(--color-slate)] line-clamp-3 leading-relaxed">{body}</p>
      </Link>

      {/* Job-specific: Pay Range & Details */}
      {type === "job" && (
        <div 
          className="mb-3 rounded-[var(--radius-md)] p-3"
          style={{ background: 'var(--color-accent-light)' }}
        >
          <div className="flex gap-4">
            {(payMin || payMax) && (
              <div className="flex flex-col gap-1">
                <span 
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-accent-dark)' }}
                >
                  Pay
                </span>
                <span className="text-sm font-bold text-[var(--color-ink)]">
                  ₹{payMin?.toLocaleString()}
                  {payMax && ` - ₹${payMax.toLocaleString()}`}
                </span>
              </div>
            )}
            {skillCategory && (
              <div className="flex flex-col gap-1">
                <span 
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-accent-dark)' }}
                >
                  Skill
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {skillCategory}
                </span>
              </div>
            )}
            {languagePref && languagePref.length > 0 && (
              <div className="flex flex-col gap-1">
                <span 
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-accent-dark)' }}
                >
                  Language
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {languagePref.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event-specific: RSVP Progress */}
      {type === "event" && rsvpCount !== undefined && capacity && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-[var(--color-ink)]">
              {rsvpCount} going
            </span>
            <span className="text-[var(--color-slate)]">{capacity} capacity</span>
          </div>
          <div 
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--color-fog)' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{ 
                width: `${Math.min((rsvpCount / capacity) * 100, 100)}%`,
                background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-dark))'
              }}
            />
          </div>
        </div>
      )}

      {/* Service-specific: Rate */}
      {type === "service" && rate && (
        <div 
          className="mb-3 rounded-[var(--radius-md)] p-3"
          style={{ background: 'var(--color-success-light)' }}
        >
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-success-dark)' }}
            >
              Rate
            </span>
            <span className="text-base font-extrabold text-[var(--color-success-dark)]">
              ₹{rate.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Image */}
      {imageUrl && (
        <div className="relative h-64 w-full overflow-hidden rounded-[var(--radius-md)] mb-3">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Meta Info */}
      {community && !author && (
        <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
          <span className="flex items-center gap-1 text-[var(--color-slate)]">
            <HiOutlineUsers className="text-[var(--color-mist)]" />
            {community}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--color-fog)]">
        <button
          onClick={onComment}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer"
          style={{
            background: 'var(--color-cloud)',
            color: 'var(--color-slate)',
            border: '1px solid var(--color-fog)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-primary-light)';
            e.currentTarget.style.color = 'var(--color-primary)';
            e.currentTarget.style.borderColor = 'rgba(43,79,212,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-cloud)';
            e.currentTarget.style.color = 'var(--color-slate)';
            e.currentTarget.style.borderColor = 'var(--color-fog)';
          }}
        >
          <HiOutlineChatBubbleLeftEllipsis className="text-[15px]" />
          {_count?.comments ?? 0}
        </button>
        <button
          onClick={onLike}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer"
          style={{
            background: 'var(--color-cloud)',
            color: 'var(--color-slate)',
            border: '1px solid var(--color-fog)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-light)';
            e.currentTarget.style.color = 'var(--color-accent-dark)';
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-cloud)';
            e.currentTarget.style.color = 'var(--color-slate)';
            e.currentTarget.style.borderColor = 'var(--color-fog)';
          }}
        >
          <HiOutlineHeart className="text-[15px]" />
          {_count?.reactions ?? 0}
        </button>
        {type === "job" && (
          <button
            onClick={onComment}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all border-none cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dark))',
              boxShadow: '0 2px 8px rgba(245,158,11,0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.25)';
            }}
          >
            Apply
          </button>
        )}
        {type !== "job" && (
          <>
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer"
              style={{
                background: 'var(--color-cloud)',
                color: 'var(--color-slate)',
                border: '1px solid var(--color-fog)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-light)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'rgba(43,79,212,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-cloud)';
                e.currentTarget.style.color = 'var(--color-slate)';
                e.currentTarget.style.borderColor = 'var(--color-fog)';
              }}
            >
              <HiOutlineBookmark className="text-[15px]" /> Save
            </button>
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer"
              style={{
                background: 'var(--color-cloud)',
                color: 'var(--color-slate)',
                border: '1px solid var(--color-fog)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary-light)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'rgba(43,79,212,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-cloud)';
                e.currentTarget.style.color = 'var(--color-slate)';
                e.currentTarget.style.borderColor = 'var(--color-fog)';
              }}
            >
              <HiOutlineShare className="text-[15px]" /> Share
            </button>
          </>
        )}
      </div>
    </article>
  );
}

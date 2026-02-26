"use client";

import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineMapPin,
  HiOutlineLanguage,
  HiOutlineShieldCheck,
  HiOutlineBriefcase,
} from "react-icons/hi2";

type JobCardProps = {
  id: string;
  title: string;
  skillCategory: string;
  payMin?: number | null;
  payMax?: number | null;
  location: string;
  languagePref: string[];
  employer: {
    id: string;
    name: string | null;
    image?: string | null;
    profile?: {
      nativePlaceState: string | null;
      trustScore: number;
    } | null;
  };
  hasCommunityBadge?: boolean;
  applicationCount?: number;
  onApply?: () => void;
};

export default function JobCard({
  id,
  title,
  skillCategory,
  payMin,
  payMax,
  location,
  languagePref,
  employer,
  hasCommunityBadge = false,
  applicationCount = 0,
  onApply,
}: JobCardProps) {
  const isVerified = employer.profile?.trustScore && employer.profile.trustScore >= 40;

  return (
    <article
      className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-fog)] p-5 mb-2.5 transition-all cursor-pointer relative overflow-hidden hover:shadow-[var(--shadow-md)] hover:translate-x-0.5"
      style={{
        borderLeft: hasCommunityBadge ? '4px solid var(--color-accent)' : '4px solid var(--color-fog)'
      }}
    >
      <div className="flex gap-4 items-start">
        {/* Employer Logo/Avatar */}
        <div 
          className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center text-xl font-bold flex-shrink-0 border border-[var(--color-fog)]"
          style={{ background: 'var(--color-cloud)' }}
        >
          {employer.image ? (
            <Image
              src={employer.image}
              alt={employer.name || "Employer"}
              width={48}
              height={48}
              className="rounded-[var(--radius-md)]"
            />
          ) : (
            <span style={{ color: 'var(--color-ink)' }}>
              {(employer.name || "E")[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-[var(--color-ink)] mb-1">{title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-slate)]">
                <span>{employer.name || "Employer"}</span>
                {isVerified && (
                  <span className="flex items-center gap-1 text-[var(--color-success-dark)] font-semibold">
                    <HiOutlineShieldCheck className="text-[13px]" />
                    Verified
                  </span>
                )}
              </div>
            </div>
            {(payMin || payMax) && (
              <div className="text-right">
                <span 
                  className="text-[15px] font-bold"
                  style={{ color: 'var(--color-success)' }}
                >
                  ₹{payMin?.toLocaleString()}
                  {payMax && ` - ₹${payMax.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {hasCommunityBadge && (
              <span 
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                style={{
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-accent-dark)',
                  border: '1px solid rgba(245,158,11,0.2)'
                }}
              >
                {employer.profile?.nativePlaceState} Community
              </span>
            )}
            {languagePref.map((lang) => (
              <span
                key={lang}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                style={{
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(43,79,212,0.15)'
                }}
              >
                <HiOutlineLanguage className="inline-block mr-1 text-[10px]" />
                {lang}
              </span>
            ))}
            <span 
              className="px-2.5 py-1 rounded-md text-[11px] font-medium"
              style={{
                background: 'var(--color-cloud)',
                color: 'var(--color-slate)',
                border: '1px solid var(--color-fog)'
              }}
            >
              <HiOutlineBriefcase className="inline-block mr-1 text-[10px]" />
              {skillCategory}
            </span>
            <span 
              className="px-2.5 py-1 rounded-md text-[11px] font-medium"
              style={{
                background: 'var(--color-cloud)',
                color: 'var(--color-slate)',
                border: '1px solid var(--color-fog)'
              }}
            >
              <HiOutlineMapPin className="inline-block mr-1 text-[10px]" />
              {location}
            </span>
          </div>

          {/* Application Count */}
          {applicationCount > 0 && (
            <div className="mt-2.5 text-xs text-[var(--color-slate)]">
              {applicationCount} application{applicationCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Apply Button */}
      <div className="mt-4 pt-4 border-t border-[var(--color-fog)]">
        <button
          onClick={onApply}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all border-none cursor-pointer"
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
          Apply Now
        </button>
      </div>
    </article>
  );
}

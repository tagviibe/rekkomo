"use client";

import Link from "next/link";

type TrustScoreImprovementProps = {
  currentScore: number;
  requiredScore?: number;
  breakdown?: Array<{
    label: string;
    points: number;
    maxPoints: number;
    completed: boolean;
    action?: string;
    actionLink?: string;
  }>;
};

export default function TrustScoreImprovement({
  currentScore,
  requiredScore = 36,
  breakdown = [],
}: TrustScoreImprovementProps) {
  const pointsNeeded = Math.max(0, requiredScore - currentScore);

  const defaultBreakdown = [
    {
      label: "Phone Verified",
      points: 0,
      maxPoints: 20,
      completed: false,
      action: "Verify your phone number",
      actionLink: "/profile/me/edit",
    },
    {
      label: "Complete Your Profile",
      points: 0,
      maxPoints: 20,
      completed: false,
      action: "Add bio, location, profession",
      actionLink: "/profile/me/edit",
    },
    {
      label: "Link Aadhaar",
      points: 0,
      maxPoints: 20,
      completed: false,
      action: "Verify with Aadhaar",
      actionLink: "/profile/me/edit",
    },
    {
      label: "Get Community Vouches",
      points: 0,
      maxPoints: 30,
      completed: false,
      action: "Ask community members to vouch for you",
      actionLink: "/profile/me",
    },
    {
      label: "Get Positive Reviews",
      points: 0,
      maxPoints: 50,
      completed: false,
      action: "Complete jobs/services to get reviews",
      actionLink: "/jobs",
    },
    {
      label: "Complete Jobs/Services",
      points: 0,
      maxPoints: 30,
      completed: false,
      action: "Apply and complete jobs",
      actionLink: "/jobs",
    },
    {
      label: "Account Age",
      points: 0,
      maxPoints: 12,
      completed: false,
      action: "Stay active on the platform",
      actionLink: "/community",
    },
  ];

  const items = breakdown.length > 0 ? breakdown : defaultBreakdown;

  return (
    <div
      className="rounded-xl p-5 mb-4"
      style={{
        background: "linear-gradient(135deg, var(--amber-light), white)",
        border: "1.5px solid rgba(245,158,11,0.3)",
        borderRadius: "16px",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "var(--amber)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            flexShrink: 0,
          }}
        >
          ⚠️
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "var(--ink)",
              marginBottom: "4px",
            }}
          >
            Trust Score Too Low
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--slate)",
              lineHeight: 1.5,
            }}
          >
            You need a trust score of <strong>{requiredScore}</strong> to post jobs. Your current score is{" "}
            <strong>{currentScore}</strong>. You need <strong>{pointsNeeded} more points</strong>.
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: "12px",
        }}
      >
        How to Improve Your Trust Score:
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, idx) => {
          const isCompleted = item.completed || item.points >= item.maxPoints;
          const canImprove = !isCompleted && item.points < item.maxPoints;
          const potentialPoints = item.maxPoints - item.points;

          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                background: isCompleted ? "var(--green-light)" : "white",
                border: `1.5px solid ${
                  isCompleted
                    ? "rgba(5,150,105,0.2)"
                    : canImprove
                    ? "rgba(245,158,11,0.2)"
                    : "var(--fog)"
                }`,
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                  background: isCompleted
                    ? "var(--green)"
                    : canImprove
                    ? "var(--amber)"
                    : "var(--fog)",
                }}
              >
                {isCompleted ? "✓" : canImprove ? "+" : "○"}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--ink)",
                    marginBottom: "2px",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--slate)",
                    marginBottom: canImprove ? "6px" : "0",
                  }}
                >
                  {item.points} / {item.maxPoints} points
                  {canImprove && (
                    <span
                      style={{
                        color: "var(--amber-dark)",
                        fontWeight: 600,
                        marginLeft: "6px",
                      }}
                    >
                      (+{potentialPoints} available)
                    </span>
                  )}
                </div>
                {canImprove && item.action && (
                  <Link
                    href={item.actionLink || "#"}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--royal)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "4px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {item.action} →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 p-3 rounded-lg"
        style={{
          background: "var(--royal-light)",
          border: "1px solid rgba(43,79,212,0.2)",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--royal)",
            marginBottom: "4px",
          }}
        >
          💡 Quick Tips:
        </div>
        <ul
          style={{
            fontSize: "11px",
            color: "var(--slate)",
            lineHeight: 1.6,
            margin: 0,
            paddingLeft: "18px",
          }}
        >
          <li>Complete your profile with all details (bio, location, profession)</li>
          <li>Verify your phone number (required, gives 20 points)</li>
          <li>Link your Aadhaar for instant +20 points</li>
          <li>Ask trusted community members to vouch for you (+10 per vouch)</li>
          <li>Complete jobs or services to get reviews (+5 per positive review)</li>
        </ul>
      </div>

      <Link
        href="/profile/me"
        className="mt-4 block text-center"
        style={{
          background: "linear-gradient(135deg, var(--royal), var(--royal-dark))",
          color: "white",
          padding: "12px 24px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 700,
          textDecoration: "none",
          display: "block",
          boxShadow: "0 2px 8px rgba(43,79,212,0.25)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(43,79,212,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(43,79,212,0.25)";
        }}
      >
        View My Trust Score →
      </Link>
    </div>
  );
}

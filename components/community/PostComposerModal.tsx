"use client";

import { useState, useRef, useEffect } from "react";
import { CommunityPostType, SOSCategory } from "@prisma/client";

type PostComposerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
  circleName: string;
  onPostCreated?: () => void;
  initialType?: CommunityPostType;
};

export default function PostComposerModal({
  isOpen,
  onClose,
  circleId,
  circleName,
  onPostCreated,
  initialType,
}: PostComposerModalProps) {
  const [postType, setPostType] = useState<CommunityPostType>(
    initialType || CommunityPostType.GENERAL
  );
  const [content, setContent] = useState("");
  const [sosCategory, setSosCategory] = useState<SOSCategory | "">("");
  const [sosUrgency, setSosUrgency] = useState<1 | 2 | 3>(3);
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetupDate, setMeetupDate] = useState("");
  const [meetupTime, setMeetupTime] = useState("");
  const [gyaanTitle, setGyaanTitle] = useState("");
  const [gyaanCategory, setGyaanCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialType) {
      setPostType(initialType);
    }
  }, [initialType]);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!content.trim()) {
      setError("Please enter some content");
      return;
    }

    if (postType === CommunityPostType.SOS) {
      if (!sosCategory) {
        setError("Please select an SOS category");
        return;
      }
    }

    if (postType === CommunityPostType.MEETUP) {
      if (!meetupLocation || !meetupDate) {
        setError("Please provide location and date for the meetup");
        return;
      }
    }

    if (postType === CommunityPostType.GYAAN) {
      if (!gyaanTitle || !gyaanCategory) {
        setError("Please provide title and category for the tip");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        type: postType,
        content: content.trim(),
      };

      if (postType === CommunityPostType.SOS) {
        payload.sosCategory = sosCategory;
        payload.sosUrgency = sosUrgency;
      }

      if (postType === CommunityPostType.MEETUP) {
        payload.meetupLocation = meetupLocation;
        const dateTime = meetupTime
          ? `${meetupDate}T${meetupTime}`
          : `${meetupDate}T12:00`;
        payload.meetupDate = new Date(dateTime).toISOString();
      }

      if (postType === CommunityPostType.GYAAN) {
        payload.gyaanTitle = gyaanTitle;
        payload.gyaanCategory = gyaanCategory;
      }

      const res = await fetch(`/api/community/circles/${circleId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create post");
        setIsSubmitting(false);
        return;
      }

      // Success - reset form and close
      setContent("");
      setSosCategory("");
      setSosUrgency(3);
      setMeetupLocation("");
      setMeetupDate("");
      setMeetupTime("");
      setGyaanTitle("");
      setGyaanCategory("");
      setPostType(CommunityPostType.GENERAL);
      setIsSubmitting(false);
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      setError("Failed to create post. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(15, 25, 35, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          borderRadius: "16px",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            borderBottom: "1px solid var(--border)",
            padding: "16px 20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              Create Post
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                marginTop: "2px",
              }}
            >
              Share with {circleName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all border-none"
            style={{
              background: "var(--cream)",
              color: "var(--muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--saffron-light)";
              e.currentTarget.style.color = "var(--saffron)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--cream)";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <span style={{ fontSize: "18px", lineHeight: 1 }}>✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4" style={{ padding: "20px" }}>
          {/* Post Type Selector */}
          <div
            className="flex gap-2 mb-4 flex-wrap"
            style={{ marginBottom: "16px" }}
          >
            {[
              { type: CommunityPostType.GENERAL, icon: "💬", label: "Post" },
              { type: CommunityPostType.JOB_SHARE, icon: "💼", label: "Job" },
              { type: CommunityPostType.MEETUP, icon: "📍", label: "Meetup" },
              { type: CommunityPostType.GYAAN, icon: "💡", label: "Tip" },
              { type: CommunityPostType.SOS, icon: "🚨", label: "SOS", sos: true },
            ].map((option) => (
              <button
                key={option.type}
                onClick={() => setPostType(option.type)}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-all border-none"
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  background:
                    postType === option.type
                      ? option.sos
                        ? "var(--color-danger)"
                        : "var(--saffron)"
                      : "var(--cream)",
                  color:
                    postType === option.type
                      ? "white"
                      : option.sos
                      ? "var(--color-danger)"
                      : "var(--muted)",
                  border: "1px solid",
                  borderColor:
                    postType === option.type
                      ? option.sos
                        ? "var(--color-danger)"
                        : "var(--saffron)"
                      : "var(--border)",
                }}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg"
              style={{
                background: "var(--color-danger-light)",
                color: "var(--color-danger)",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              {error}
            </div>
          )}

          {/* Gyaan Title Input */}
          {postType === CommunityPostType.GYAAN && (
            <div className="mb-4">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Tip Title
              </label>
              <input
                type="text"
                value={gyaanTitle}
                onChange={(e) => setGyaanTitle(e.target.value)}
                placeholder="e.g., How to get your security deposit back"
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  padding: "10px 14px",
                }}
              />
            </div>
          )}

          {/* Gyaan Category */}
          {postType === CommunityPostType.GYAAN && (
            <div className="mb-4">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Category
              </label>
              <select
                value={gyaanCategory}
                onChange={(e) => setGyaanCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  padding: "10px 14px",
                }}
              >
                <option value="">Select category</option>
                <option value="housing">🏠 Housing</option>
                <option value="legal">⚖️ Legal</option>
                <option value="health">🏥 Health</option>
                <option value="work">💼 Work</option>
                <option value="government">🏛️ Government</option>
              </select>
            </div>
          )}

          {/* SOS Category */}
          {postType === CommunityPostType.SOS && (
            <div className="mb-4">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                What kind of help do you need?
              </label>
              <select
                value={sosCategory}
                onChange={(e) => setSosCategory(e.target.value as SOSCategory)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  padding: "10px 14px",
                }}
              >
                <option value="">Select category</option>
                <option value={SOSCategory.HOUSING}>🏠 Housing</option>
                <option value={SOSCategory.PAYMENT}>💰 Payment</option>
                <option value={SOSCategory.MEDICAL}>🏥 Medical</option>
                <option value={SOSCategory.SAFETY}>🚨 Safety</option>
                <option value={SOSCategory.LOAN}>💵 Loan</option>
                <option value={SOSCategory.LEGAL}>⚖️ Legal</option>
                <option value={SOSCategory.OTHER}>❓ Other</option>
              </select>
            </div>
          )}

          {/* SOS Urgency */}
          {postType === CommunityPostType.SOS && (
            <div className="mb-4">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Urgency Level
              </label>
              <div className="flex gap-2">
                {[
                  { level: 1, label: "🚨 Critical", color: "var(--color-danger)" },
                  { level: 2, label: "⚠️ Urgent", color: "var(--gold)" },
                  { level: 3, label: "ℹ️ Moderate", color: "var(--blue)" },
                ].map((option) => (
                  <button
                    key={option.level}
                    onClick={() => setSosUrgency(option.level as 1 | 2 | 3)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-none"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background:
                        sosUrgency === option.level
                          ? option.color
                          : "var(--cream)",
                      color:
                        sosUrgency === option.level ? "white" : "var(--muted)",
                      border: "1px solid",
                      borderColor:
                        sosUrgency === option.level
                          ? option.color
                          : "var(--border)",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meetup Location */}
          {postType === CommunityPostType.MEETUP && (
            <div className="mb-4">
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--ink)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Location
              </label>
              <input
                type="text"
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                placeholder="e.g., Khadakwasla Lake, Pune"
                className="w-full px-4 py-2.5 rounded-lg border text-sm mb-3"
                style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "14px",
                  padding: "10px 14px",
                  marginBottom: "12px",
                }}
              />
            </div>
          )}

          {/* Meetup Date & Time */}
          {postType === CommunityPostType.MEETUP && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={meetupDate}
                  onChange={(e) => setMeetupDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    padding: "10px 14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Time
                </label>
                <input
                  type="time"
                  value={meetupTime}
                  onChange={(e) => setMeetupTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    padding: "10px 14px",
                  }}
                />
              </div>
            </div>
          )}

          {/* Content Textarea */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: "6px",
                display: "block",
              }}
            >
              {postType === CommunityPostType.GYAAN
                ? "Tip Details"
                : postType === CommunityPostType.SOS
                ? "Describe your situation"
                : "What's on your mind?"}
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === CommunityPostType.GENERAL
                  ? `Share something with ${circleName}...`
                  : postType === CommunityPostType.JOB_SHARE
                  ? "Describe the job opportunity..."
                  : postType === CommunityPostType.MEETUP
                  ? "Tell us about the meetup..."
                  : postType === CommunityPostType.GYAAN
                  ? "Share your knowledge and tips..."
                  : "Describe what help you need..."
              }
              className="w-full px-4 py-3 rounded-lg border resize-none"
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: "10px",
                fontSize: "14px",
                padding: "12px 14px",
                minHeight: "120px",
                fontFamily: "var(--font-primary)",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                marginTop: "4px",
                textAlign: "right",
              }}
            >
              {content.length} characters
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-4 border-t"
          style={{
            borderTop: "1px solid var(--border)",
            padding: "16px 20px",
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all border-none"
            style={{
              background: "var(--cream)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--saffron-light)";
              e.currentTarget.style.color = "var(--saffron)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--cream)";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="px-6 py-2 rounded-lg text-sm font-bold text-white transition-all border-none"
            style={{
              background: isSubmitting
                ? "var(--muted)"
                : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
              fontSize: "13px",
              fontWeight: 700,
              padding: "8px 24px",
              borderRadius: "8px",
              opacity: isSubmitting || !content.trim() ? 0.6 : 1,
              cursor: isSubmitting || !content.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

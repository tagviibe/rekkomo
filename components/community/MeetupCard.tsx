"use client";

import { useRouter } from "next/navigation";

export default function MeetupCard({ meetup, post }: any) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to event detail if eventId is available
    if (meetup.eventId) {
      router.push(`/events/${meetup.eventId}`);
    } else if (post?.eventId) {
      router.push(`/events/${post.eventId}`);
    } else {
      // Fallback: search by title
      router.push(`/events?search=${encodeURIComponent(meetup.title)}`);
    }
  };

  const eventDate = new Date(meetup.meetupDate);
  const formattedDate = eventDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      className="rounded-2xl border bg-white p-5 cursor-pointer transition-all"
      style={{
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
      onClick={handleClick}
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
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{
            background: "linear-gradient(135deg, var(--green), var(--green-dark))",
          }}
        >
          🎉
        </div>
        <div className="flex-1">
          <h3 className="font-semibold" style={{ color: "var(--ink)" }}>
            {meetup.title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {post.content}
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
            <span>📍 {meetup.location}</span>
            <span>📅 {formattedDate}</span>
            <span>{meetup.rsvpCount || 0} going</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--green), var(--green-dark))",
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
        </div>
      </div>
    </div>
  );
}

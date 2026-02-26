"use client";

export default function MeetupCard({ meetup, post }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-blue-200" />
        <div className="flex-1">
          <h3 className="font-semibold">{meetup.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{post.content}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span>📍 {meetup.location}</span>
            <span>📅 {new Date(meetup.meetupDate).toLocaleDateString()}</span>
            <span>{meetup.rsvpCount} going</span>
          </div>
          <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            RSVP
          </button>
        </div>
      </div>
    </div>
  );
}

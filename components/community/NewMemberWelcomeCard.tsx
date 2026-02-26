"use client";

export default function NewMemberWelcomeCard({ member, onWelcome, onConnect }: any) {
  return (
    <div className="rounded-2xl border bg-amber-50 p-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-amber-200" />
        <div className="flex-1">
          <h3 className="font-semibold">👋 New member from {member.nativeDistrict}!</h3>
          <p className="text-sm text-gray-600">{member.name}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onWelcome(member.id)}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white"
        >
          Say Hello 👋
        </button>
        <button
          onClick={() => onConnect(member.id)}
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

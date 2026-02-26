"use client";

export default function GyaanEntry({ entry, post }: any) {
  const categoryColors: Record<string, string> = {
    housing: "bg-emerald-100 text-emerald-700",
    legal: "bg-blue-100 text-blue-700",
    health: "bg-red-100 text-red-700",
    work: "bg-amber-100 text-amber-700",
    government: "bg-navy-100 text-navy-700",
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      {entry.isPinned && (
        <div className="mb-2 flex items-center gap-1 text-xs text-amber-600">
          <span>📌</span>
          <span>Pinned</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                categoryColors[entry.category] || "bg-gray-100 text-gray-700"
              }`}
            >
              {entry.category}
            </span>
            <span className="text-xs text-gray-500">
              {entry.upvoteCount} upvotes
            </span>
          </div>
          <h3 className="mt-2 font-semibold">{entry.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{post.content}</p>
          <button className="mt-3 rounded-lg border px-3 py-1.5 text-sm">
            👍 Upvote
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineHeart,
  HiOutlineFlag,
  HiOutlineBookmark,
  HiOutlineShare,
  HiOutlineChatBubbleLeft,
  HiOutlineCalendar,
} from "react-icons/hi2";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  parentId?: string | null;
  depth: number;
};

type Post = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  locationContext?: string | null;
  imageUrl?: string | null;
  comments: Comment[];
  reactions: { id: string; type: string }[];
};

const REPORT_REASONS = ["Scam", "Abuse", "Spam"];

const isEventPost = (post: Post) => {
  if (post.type !== "GENERAL") return false;
  const body = post.body.toLowerCase();
  return body.includes("when:") || body.includes("where:") || body.includes("fee:");
};

const extractEventFields = (body: string) => {
  const lines = body.split("\n");
  const when = lines.find((line) => line.toLowerCase().startsWith("when:")) ?? "";
  const where = lines.find((line) => line.toLowerCase().startsWith("where:")) ?? "";
  const fee = lines.find((line) => line.toLowerCase().startsWith("fee:")) ?? "";
  const meta = new Set([when, where, fee].filter(Boolean));
  const about = lines.filter((line) => !meta.has(line)).join("\n").trim();
  return {
    when: when.replace(/^when:\s*/i, ""),
    where: where.replace(/^where:\s*/i, ""),
    fee: fee.replace(/^fee:\s*/i, ""),
    about,
  };
};

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("Scam");
  const [blockUser, setBlockUser] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchPost = async () => {
    setLoading(true);
    const res = await fetch(`/api/posts/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPost(data.post);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to load post");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const addComment = async () => {
    if (!comment.trim()) return;
    const res = await fetch(`/api/posts/${params.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment.trim() }),
    });
    if (res.ok) {
      setComment("");
      await fetchPost();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to comment");
    }
  };

  const reportPost = async () => {
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "POST",
        targetId: params.id,
        reason,
      }),
    });
    if (res.ok) {
      setReportOpen(false);
      setToast(blockUser ? "Reported and blocked" : "Report submitted");
      setTimeout(() => setToast(null), 1500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Report failed");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-slate-600">Loading post...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-slate-600">Post not found.</p>
      </main>
    );
  }

  const eventMeta = isEventPost(post) ? extractEventFields(post.body) : null;

  return (
    <main className="mx-auto max-w-md px-4 py-8 md:max-w-3xl md:px-6">
      {isEventPost(post) ? (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {post.imageUrl && (
            <div className="relative h-52 w-full md:h-64">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            </div>
          )}
          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Event
              </p>
              <h1 className="mt-1 text-lg font-semibold md:text-xl">
                {post.title}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>

            {eventMeta && (
              <>
                {eventMeta.when && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <HiOutlineCalendar className="mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        When
                      </p>
                      <p className="text-sm text-slate-800">{eventMeta.when}</p>
                    </div>
                  </div>
                )}
                {eventMeta.where && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <HiOutlineMapPin className="mt-0.5 text-slate-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Location
                      </p>
                      <p className="text-sm text-slate-800">
                        {eventMeta.where}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {eventMeta?.about && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-800">About</h2>
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                  {eventMeta.about}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4 text-xs text-slate-600">
              <div>
                <p className="font-semibold">Host</p>
                <div className="mt-2 flex -space-x-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                    H
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">Going</p>
                <div className="mt-2 flex items-center justify-end -space-x-2">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <span
                      key={idx}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700"
                    >
                      {idx + 1}
                    </span>
                  ))}
                  <span className="ml-2 text-[11px] text-slate-500">
                    {post.reactions.length || 0} interested
                  </span>
                </div>
              </div>
            </div>

            <button
              className="mt-2 w-full rounded-full border border-blue-600 bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={() => {
                setToast("Marked as interested");
                setTimeout(() => setToast(null), 1200);
              }}
            >
              I&apos;m interested
            </button>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="rounded-full border px-3 py-1 text-xs text-blue-600">
              {post.type}
            </span>
            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold">{post.title}</h1>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
            {post.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-2 rounded-full border px-3 py-1">
              <HiOutlineMapPin className="text-slate-500" />
              {post.locationContext || "Location not set"}
            </span>
          </div>
          {post.imageUrl && (
            <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <button className="rounded-full border px-3 py-1">DM</button>
            <button className="flex items-center gap-1 rounded-full border px-3 py-1">
              <HiOutlineBookmark /> Save
            </button>
            <button className="flex items-center gap-1 rounded-full border px-3 py-1">
              <HiOutlineShare /> Share
            </button>
            <button
              className="flex items-center gap-1 rounded-full border px-3 py-1"
              onClick={() => setReportOpen(true)}
            >
              <HiOutlineFlag /> Report
            </button>
            <span>
              <HiOutlineHeart className="inline-block" /> {post.reactions.length} ·{" "}
              <HiOutlineChatBubbleLeft className="inline-block" />{" "}
              {post.comments.length}
            </span>
          </div>
        </div>
      )}

      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Comments</h2>
        <div className="mt-3 flex gap-3">
          <input
            className="w-full rounded-lg border p-2 text-sm"
            placeholder={
              session?.user ? "Write a comment..." : "Login to comment"
            }
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={!session?.user}
          />
          <button
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            onClick={addComment}
            disabled={!session?.user}
          >
            <HiOutlineChatBubbleLeftEllipsis /> Post
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {post.comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
          {post.comments.map((item) => (
            <div key={item.id} className="rounded-lg border p-3 text-sm">
              {item.body}
            </div>
          ))}
        </div>
      </section>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h3 className="text-lg font-semibold">Report post</h3>
            <div className="mt-4 space-y-2 text-sm">
              {REPORT_REASONS.map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={reason === item}
                    onChange={() => setReason(item)}
                  />
                  {item}
                </label>
              ))}
              <label className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={blockUser}
                  onChange={(event) => setBlockUser(event.target.checked)}
                />
                Block user
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={() => setReportOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                onClick={reportPost}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-white px-4 py-2 text-sm text-red-600 shadow">
          {error}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-16 right-6 rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow">
          {toast}
        </div>
      )}
    </main>
  );
}

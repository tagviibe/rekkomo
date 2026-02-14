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

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
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

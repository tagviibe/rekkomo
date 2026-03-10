"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import FeedPost from "@/components/community/FeedPost";
import Image from "next/image";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/posts/${params.id}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        if (data.post.likes && data.post.likes.length > 0) {
          setLikedPosts(new Set([data.post.id]));
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error ?? "Failed to load post");
      }
    } catch (err) {
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        setPost((prev: any) => {
          if (!prev) return prev;
          const currentCount = prev._count?.likes || 0;
          return {
            ...prev,
            _count: {
              ...prev._count,
              likes: data.liked ? currentCount + 1 : Math.max(currentCount - 1, 0),
            },
          };
        });
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleReply = async () => {
    if (!comment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${params.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });

      if (res.ok) {
        setComment("");
        await fetchPost();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to post comment");
      }
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/community/post/${postId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this post on REKKOMO",
          text: "Check out this post on REKKOMO",
          url: postUrl,
        });
      } catch (error) {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(postUrl);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ color: "var(--color-danger)" }}>{error || "Post not found"}</div>
        <button
          onClick={() => router.push("/community")}
          style={{
            marginTop: "16px",
            padding: "10px 20px",
            borderRadius: "8px",
            background: "var(--saffron)",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: "20px",
          padding: "8px 16px",
          borderRadius: "8px",
          background: "var(--cream)",
          border: "1px solid var(--border)",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <FeedPost
        post={post}
        onLike={handleLike}
        onReply={handleReply}
        onShare={handleShare}
        isLiked={likedPosts.has(post.id)}
      />

      {/* Comments Section */}
      <div
        style={{
          marginTop: "20px",
          background: "white",
          borderRadius: "16px",
          border: "1.5px solid var(--border)",
          padding: "20px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
          Comments ({post._count?.replies || 0})
        </h3>

        {/* Comment Input */}
        {session?.user && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: session.user.image
                    ? "transparent"
                    : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "white",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  (session.user.name || "U")[0].toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1.5px solid var(--border)",
                    fontSize: "14px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={!comment.trim() || submitting}
                  style={{
                    marginTop: "8px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: comment.trim() && !submitting ? "var(--saffron)" : "var(--fog)",
                    color: comment.trim() && !submitting ? "white" : "var(--muted)",
                    border: "none",
                    cursor: comment.trim() && !submitting ? "pointer" : "not-allowed",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {post.replies && post.replies.length > 0 ? (
            post.replies.map((reply: any) => (
              <div
                key={reply.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "var(--cream)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "9px",
                    background: reply.author.image
                      ? "transparent"
                      : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "white",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {reply.author.image ? (
                    <Image
                      src={reply.author.image}
                      alt={reply.author.name || "User"}
                      width={36}
                      height={36}
                      style={{ borderRadius: "7px" }}
                    />
                  ) : (
                    (reply.author.name || "U")[0].toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                    {reply.author.name || "Anonymous"}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--ink)", lineHeight: 1.6 }}>
                    {reply.content}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                    {new Date(reply.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

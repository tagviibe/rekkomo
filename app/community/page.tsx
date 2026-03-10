"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import FeedPost from "@/components/community/FeedPost";
import PostComposerModal from "@/components/community/PostComposerModal";
import ConnectButton from "@/components/ConnectButton";
import { CircleLevel, CommunityPostType } from "@prisma/client";

const TRUST_CIRCLE_RADIUS = 22;
const TRUST_CIRCLE_CIRCUMFERENCE = 2 * Math.PI * TRUST_CIRCLE_RADIUS;

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myCircles, setMyCircles] = useState<any[]>([]);
  const [discoverCircles, setDiscoverCircles] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [peopleFromOdisha, setPeopleFromOdisha] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [primaryCircle, setPrimaryCircle] = useState<any>(null);
  const [feedMode, setFeedMode] = useState<"community" | "global">("community");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<CommunityPostType | undefined>(undefined);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [topHelpers, setTopHelpers] = useState<any[]>([]);
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callback=/community");
      return;
    }
    if (status === "authenticated") {
      fetchCircles();
    }
  }, [status, router]);

  useEffect(() => {
    if (feedMode === "global") {
      fetchGlobalFeed();
    } else if (primaryCircle) {
      fetchFeed(primaryCircle.id);
      fetchUpcomingEvents(primaryCircle.id);
    }
  }, [primaryCircle, activeFilter, feedMode]);

  useEffect(() => {
    if (primaryCircle) {
      fetchPeople();
      fetchActiveSOS();
      fetchOnlineUsers();
      fetchSuggestedConnections();
    }
  }, [primaryCircle, session?.user?.id]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTrustScore();
    }
  }, [status]);

  const handlePostCreated = () => {
    if (feedMode === "global") {
      fetchGlobalFeed();
    } else if (primaryCircle) {
      fetchFeed(primaryCircle.id);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        // Update liked state
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        // Update feed to reflect new like count
        setFeed((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              const currentCount = post.likeCount || post._count?.likes || 0;
              return {
                ...post,
                likeCount: data.liked ? currentCount + 1 : Math.max(currentCount - 1, 0),
                _count: {
                  ...post._count,
                  likes: data.liked ? currentCount + 1 : Math.max(currentCount - 1, 0),
                },
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleReply = (postId: string) => {
    // Navigate to post detail page or open comment modal
    router.push(`/community/post/${postId}`);
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
        // User cancelled or error occurred, fallback to copy
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(postUrl);
      alert("Link copied to clipboard!");
    }
  };

  const fetchCircles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/community/circles");
      if (res.ok) {
        const data = await res.json();
        const all = [
          ...(data.circles.STATE || []),
          ...(data.circles.DISTRICT || []),
          ...(data.circles.MOHALLA || []),
        ];
        const circles = all.filter((c: any) => c.isMember);
        const discover = all.filter((c: any) => !c.isMember);
        setMyCircles(circles);
        setDiscoverCircles(discover);
        
        const primary = circles.find((c: any) => c.level === CircleLevel.STATE);
        if (primary) {
          setPrimaryCircle(primary);
          fetchTopHelpers(primary.id);
        } else {
          setLoading(false);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to load circles");
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch circles:", error);
      setError("Failed to load circles. Please try again.");
      setLoading(false);
    }
  };

  const fetchFeed = async (circleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const type = activeFilter === "all" ? null : activeFilter;
      const url = type && type !== "all"
        ? `/api/community/circles/${circleId}/feed?type=${type}`
        : `/api/community/circles/${circleId}/feed`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setFeed(items);
        // Initialize liked posts from feed data
        const liked = new Set<string>();
        items.forEach((post: any) => {
          if (post.likes && post.likes.length > 0) {
            liked.add(post.id);
          }
        });
        setLikedPosts(liked);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to load feed");
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      setError("Failed to load feed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const type = activeFilter === "all" ? null : activeFilter;
      const url = type && type !== "all"
        ? `/api/community/feed/global?type=${type}`
        : `/api/community/feed/global`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setFeed(items);
        // Initialize liked posts from feed data
        const liked = new Set<string>();
        items.forEach((post: any) => {
          if (post.likes && post.likes.length > 0) {
            liked.add(post.id);
          }
        });
        setLikedPosts(liked);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Failed to load global feed");
      }
    } catch (error) {
      console.error("Failed to fetch global feed:", error);
      setError("Failed to load global feed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async (circleId: string) => {
    try {
      const res = await fetch(`/api/community/circles/${circleId}/feed?type=MEETUP`);
      if (res.ok) {
        const data = await res.json();
        const upcoming = (data.items || []).filter((item: any) => {
          if (item.meetup?.meetupDate) {
            return new Date(item.meetup.meetupDate) > new Date();
          }
          return false;
        }).slice(0, 3);
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchActiveSOS = async () => {
    try {
      if (!primaryCircle) return;
      const res = await fetch(`/api/community/circles/${primaryCircle.id}/feed?type=SOS`);
      if (res.ok) {
        const data = await res.json();
        const sosPosts = (data.items || []).slice(0, 2);
        setActiveSOS(sosPosts);
      }
    } catch (error) {
      console.error("Failed to fetch SOS:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      if (!primaryCircle) return;
      const res = await fetch(`/api/community/circles/${primaryCircle.id}/members?limit=3`);
      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch online users:", error);
    }
  };

  const fetchSuggestedConnections = async () => {
    try {
      if (!primaryCircle) return;
      const res = await fetch(`/api/community/circles/${primaryCircle.id}/members?limit=2`);
      if (res.ok) {
        const data = await res.json();
        const suggested = (data.members || []).filter((m: any) => {
          const userId = m.user?.id || m.id;
          return userId && userId !== session?.user?.id;
        }).slice(0, 2);
        setSuggestedConnections(suggested);
      }
    } catch (error) {
      console.error("Failed to fetch suggested connections:", error);
    }
  };

  const fetchTopHelpers = async (circleId: string) => {
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await fetch(`/api/community/circles/${circleId}/leaderboard?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        const leaderboard = data.leaderboard || {};
        
        const allEntries: any[] = [];
        
        if (leaderboard.most_helpful?.length > 0) {
          const entry = leaderboard.most_helpful[0];
          allEntries.push({
            ...entry,
            category: "Most Helpful",
            rank: 1,
            rankIcon: "🥇",
            badgeLabel: entry.badgeLabel || "Most Helpful",
            score: entry.score || 0,
          });
        }
        
        if (leaderboard.job_connector?.length > 0 && allEntries.length < 3) {
          const entry = leaderboard.job_connector[0];
          allEntries.push({
            ...entry,
            category: "Job Connector",
            rank: 2,
            rankIcon: "🥈",
            badgeLabel: entry.badgeLabel || "Job Connector",
            score: entry.score || 0,
          });
        }
        
        if (leaderboard.organizer?.length > 0 && allEntries.length < 3) {
          const entry = leaderboard.organizer[0];
          allEntries.push({
            ...entry,
            category: "Top Organizer",
            rank: 3,
            rankIcon: "🥉",
            badgeLabel: entry.badgeLabel || "Top Organizer",
            score: entry.score || 0,
          });
        }
        
        setTopHelpers(allEntries.slice(0, 3));
      } else {
        setTopHelpers([]);
      }
    } catch (error) {
      console.error("Failed to fetch top helpers:", error);
      setTopHelpers([]);
    }
  };

  const fetchPeople = async () => {
    try {
      if (!primaryCircle) {
        setPeopleFromOdisha([]);
        return;
      }
      
      try {
        const res = await fetch(`/api/community/circles/${primaryCircle.id}/members?limit=5`);
        if (res.ok) {
          const data = await res.json();
          const members = data.members || [];
          
          const filteredMembers = members
            .filter((member: any) => {
              const userId = member.user?.id || member.id;
              return userId && userId !== session?.user?.id;
            })
            .slice(0, 5);
          
          setPeopleFromOdisha(filteredMembers);
          
          if (session?.user?.id && filteredMembers.length > 0) {
            const statusPromises = filteredMembers.map(async (member: any) => {
              if (member.user?.id && member.user.id !== session.user.id) {
                try {
                  const statusRes = await fetch(`/api/follow/status/${member.user.id}`);
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    return { userId: member.user.id, isFollowing: statusData.isFollowing };
                  }
                } catch (err) {
                  console.error(`Failed to fetch follow status for ${member.user.id}:`, err);
                }
              }
              return null;
            });
            
            const statuses = await Promise.all(statusPromises);
            const statusMap: Record<string, boolean> = {};
            statuses.forEach((status) => {
              if (status) {
                statusMap[status.userId] = status.isFollowing;
              }
            });
            setFollowingStatus((prev) => ({ ...prev, ...statusMap }));
          }
        } else {
          setPeopleFromOdisha([]);
        }
      } catch (err) {
        console.error(`Failed to fetch members from primary circle:`, err);
        setPeopleFromOdisha([]);
      }
    } catch (error) {
      console.error("Failed to fetch people:", error);
      setPeopleFromOdisha([]);
    }
  };

  const fetchTrustScore = async () => {
    try {
      const res = await fetch("/api/trust-score/breakdown");
      if (res.ok) {
        const data = await res.json();
        setTrustScore(data.score ?? 0);
      } else {
        const profileRes = await fetch("/api/profile/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setTrustScore(profileData.profile?.trustScore ?? 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch trust score:", error);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const trustScoreMax = 200;
  const safeTrustScore = Math.max(0, Math.min(trustScore ?? 0, trustScoreMax));
  const trustPercentage = (safeTrustScore / trustScoreMax) * 100;
  const trustStrokeDashoffset =
    TRUST_CIRCLE_CIRCUMFERENCE -
    (Math.min(100, trustPercentage) / 100) * TRUST_CIRCLE_CIRCUMFERENCE;

  const getTrustLabel = (score: number) => {
    if (score >= 100) return "🥈 Community Trusted";
    if (score >= 40) return "⭐ Building Trust";
    return "🌱 New Member";
  };

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStateEmoji = (state: string | null | undefined) => {
    if (!state) return "🌊";
    const stateMap: Record<string, string> = {
      Odisha: "🌊",
      "Uttar Pradesh": "🏛️",
      Bihar: "🌾",
      Jharkhand: "🐯",
    };
    return stateMap[state] || "🌊";
  };

  const userProfile = session?.user;
  const userName = userProfile?.name || "User";
  const userImage = userProfile?.image;
  const userInitials = getUserInitials(userName);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--paper)" }}>
        <main className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 lg:px-8">
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Navbar */}
      <div
        style={{
          height: "58px",
          background: "var(--white)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 1px 12px rgba(13,19,64,.06)",
          position: "sticky",
          top: 0,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "256px", flexShrink: 0 }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: 900,
              color: "white",
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "var(--ink)", letterSpacing: "-0.4px" }}>
              REKKOMO
            </div>
            <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 600, marginTop: "1px" }}>
              Apna Sheher · Apna Circle
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            maxWidth: "420px",
            background: "var(--cream)",
            border: "1.5px solid var(--border)",
            borderRadius: "10px",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "9px",
            transition: "all 0.2s",
            cursor: "text",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(232,98,26,.3)";
            e.currentTarget.style.background = "white";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232,98,26,.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--cream)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>🔍</div>
          <input
            type="text"
            placeholder="Search people, jobs, services, posts..."
            style={{
              flex: 1,
              fontSize: "13px",
              color: "var(--ink)",
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--muted)",
              background: "var(--border)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            ⌘K
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => {
              setComposerType(undefined);
              setIsComposerOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "100px",
              background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
              color: "var(--ink)",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 2px 10px rgba(232,98,26,.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,98,26,.38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(232,98,26,.3)";
            }}
          >
            ✏️ Post Update
          </button>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--cream)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--saffron-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--cream)";
            }}
            onClick={() => router.push("/messages")}
          >
            💬
            <div
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--color-danger)",
                border: "2px solid white",
              }}
            />
          </div>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--cream)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--saffron-light)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--cream)";
            }}
            onClick={() => router.push("/notifications")}
          >
            🔔
            <div
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--color-danger)",
                border: "2px solid white",
              }}
            />
          </div>
          <Link href="/profile/me">
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: userImage
                  ? "transparent"
                  : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 800,
                color: "white",
                cursor: "pointer",
                border: "2px solid transparent",
                transition: "all 0.15s",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--saffron)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              {userImage ? (
                <Image src={userImage} alt={userName} width={36} height={36} style={{ borderRadius: "8px" }} />
              ) : (
                userInitials
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "256px 1fr 300px",
          gap: 0,
          maxWidth: "1280px",
          margin: "0 auto",
          padding: 0,
          minHeight: "calc(100vh - 58px)",
          alignItems: "start",
        }}
      >
        {/* LEFT SIDEBAR */}
        <div
          style={{
            width: "256px",
            padding: "20px 16px",
            position: "sticky",
            top: "58px",
            height: "calc(100vh - 58px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            borderRight: "1px solid var(--border)",
            background: "var(--white)",
          }}
        >
          {/* Profile Card */}
          <div
            style={{
              background: "linear-gradient(150deg, var(--saffron-dark), var(--saffron))",
              borderRadius: "14px",
              padding: "16px 14px",
              marginBottom: "8px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,.1), transparent 70%)",
                top: "-30px",
                right: "-30px",
              }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                background: "linear-gradient(135deg, rgba(255,255,255,.25), rgba(255,255,255,.1))",
                border: "2px solid rgba(255,255,255,.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 900,
                color: "white",
                marginBottom: "10px",
              }}
            >
              {userImage ? (
                <Image src={userImage} alt={userName} width={48} height={48} style={{ borderRadius: "11px" }} />
              ) : (
                userInitials
              )}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "white", letterSpacing: "-0.3px" }}>
              {userName}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,.6)", marginTop: "2px" }}>
              {userProfile?.profile?.profession || "Worker"} · {userProfile?.profile?.currentCity || "City"}
            </div>
            <div style={{ display: "flex", gap: "5px", marginTop: "8px", flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "9px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,.12)",
                  color: "rgba(255,255,255,.85)",
                }}
              >
                {getStateEmoji(userProfile?.profile?.nativePlaceState)} {userProfile?.profile?.nativePlaceState || "State"}
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "9px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,.12)",
                  color: "rgba(255,255,255,.85)",
                }}
              >
                💬 Hindi
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "9px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,.12)",
                  color: "rgba(255,255,255,.85)",
                }}
              >
                ⭐ {safeTrustScore} Trust
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 0,
                marginTop: "12px",
                background: "rgba(255,255,255,.08)",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "8px 4px", textAlign: "center", borderRight: "1px solid rgba(255,255,255,.1)" }}>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "white" }}>14</div>
                <div style={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,255,255,.5)", marginTop: "1px" }}>
                  Connections
                </div>
              </div>
              <div style={{ padding: "8px 4px", textAlign: "center", borderRight: "1px solid rgba(255,255,255,.1)" }}>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "white" }}>3</div>
                <div style={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,255,255,.5)", marginTop: "1px" }}>
                  Vouches
                </div>
              </div>
              <div style={{ padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "white" }}>{safeTrustScore}</div>
                <div style={{ fontSize: "8px", fontWeight: 600, color: "rgba(255,255,255,.5)", marginTop: "1px" }}>
                  Trust
                </div>
              </div>
            </div>
          </div>

          {/* MY CIRCLES */}
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "8px 10px 4px",
            }}
          >
            MY CIRCLES
          </div>
          {primaryCircle && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "11px",
                background: "var(--cream)",
                border: "1.5px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.15s",
                marginBottom: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--saffron)";
                e.currentTarget.style.background = "var(--saffron-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--cream)";
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--saffron-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {getStateEmoji(primaryCircle.state)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>
                  {primaryCircle.name}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
                  {primaryCircle.memberCount || 0} members · 47 posts/week
                </div>
              </div>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--green)",
                  marginLeft: "auto",
                  flexShrink: 0,
                }}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "11px",
              background: feedMode === "global" ? "var(--saffron-light)" : "var(--cream)",
              border: `1.5px solid ${feedMode === "global" ? "var(--saffron)" : "var(--border)"}`,
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: "4px",
            }}
            onClick={() => setFeedMode("global")}
            onMouseEnter={(e) => {
              if (feedMode !== "global") {
                e.currentTarget.style.borderColor = "var(--saffron)";
                e.currentTarget.style.background = "var(--saffron-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (feedMode !== "global") {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--cream)";
              }
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--saffron-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              🌐
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>Global Feed</div>
              <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>All Circles</div>
            </div>
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "6px 0" }} />

          {/* Navigate */}
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "8px 10px 4px",
            }}
          >
            Navigate
          </div>
          {[
            { icon: "👥", label: "Community Feed", href: "/community", active: true, count: feed.length },
            { icon: "💼", label: "Jobs", href: "/jobs", count: 12 },
            { icon: "🔧", label: "Services", href: "/services" },
            { icon: "💬", label: "Messages", href: "/messages", count: 3, countColor: "red" },
            { icon: "🔔", label: "Notifications", href: "/notifications", count: 7, countColor: "red" },
            { icon: "🔖", label: "Saved Posts", href: "/saved" },
            { icon: "👤", label: "My Profile", href: "/profile/me" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontSize: "13px",
                  fontWeight: item.active ? 700 : 600,
                  color: item.active ? "var(--saffron)" : "var(--muted)",
                  background: item.active ? "var(--saffron-light)" : "transparent",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = "var(--cream)";
                    e.currentTarget.style.color = "var(--ink)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--muted)";
                  }
                }}
              >
                <div style={{ fontSize: "18px", width: "22px", textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count !== undefined && (
                  <div
                    style={{
                      marginLeft: "auto",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "9px",
                      background: item.countColor === "red" ? "var(--color-danger)" : "var(--saffron)",
                      color: "white",
                      fontSize: "9px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {item.count}
                  </div>
                )}
              </div>
            </Link>
          ))}

          <div style={{ height: "1px", background: "var(--border)", margin: "6px 0" }} />

          {/* My Activity */}
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "8px 10px 4px",
            }}
          >
            My Activity
          </div>
          {[
            { icon: "📝", label: "My Posts", href: "/profile/me?tab=posts" },
            { icon: "🤝", label: "Connections", href: "/profile/me?tab=connections" },
            { icon: "⚙️", label: "Settings", href: "/settings" },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--cream)";
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                <div style={{ fontSize: "18px", width: "22px", textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CENTER FEED */}
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            minWidth: 0,
            background: "var(--paper)",
            borderRight: "1px solid var(--border)",
          }}
        >
          {/* Circle Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              onClick={() => setFeedMode("community")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 20px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                border: "1.5px solid transparent",
                background: feedMode === "community" ? "var(--saffron)" : "var(--white)",
                color: feedMode === "community" ? "white" : "var(--muted)",
                borderColor: feedMode === "community" ? "var(--saffron)" : "var(--border)",
                boxShadow: feedMode === "community" ? "0 4px 14px rgba(232,98,26,.25)" : "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                if (feedMode !== "community") {
                  e.currentTarget.style.borderColor = "var(--saffron)";
                  e.currentTarget.style.color = "var(--saffron)";
                }
              }}
              onMouseLeave={(e) => {
                if (feedMode !== "community") {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              👥 {primaryCircle?.name?.replace(" Circle", "") || "Odisha"} — {primaryCircle?.city || "Hyderabad"}
              {feedMode === "community" && (
                <div
                  style={{
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "9px",
                    background: "var(--gold)",
                    color: "var(--ink)",
                    fontSize: "9px",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {feed.length}
                </div>
              )}
            </button>
            <button
              onClick={() => setFeedMode("global")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 20px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                border: "1.5px solid transparent",
                background: feedMode === "global" ? "var(--saffron)" : "var(--white)",
                color: feedMode === "global" ? "white" : "var(--muted)",
                borderColor: feedMode === "global" ? "var(--saffron)" : "var(--border)",
                boxShadow: feedMode === "global" ? "0 4px 14px rgba(232,98,26,.25)" : "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                if (feedMode !== "global") {
                  e.currentTarget.style.borderColor = "var(--saffron)";
                  e.currentTarget.style.color = "var(--saffron)";
                }
              }}
              onMouseLeave={(e) => {
                if (feedMode !== "global") {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
            >
              🌐 Global Feed
            </button>
          </div>

          {/* Compose Box */}
          {feedMode === "community" && primaryCircle && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "16px",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
                marginBottom: "16px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(27,79,138,.2)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: userImage
                      ? "transparent"
                      : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: 800,
                    color: "white",
                    overflow: "hidden",
                  }}
                >
                  {userImage ? (
                    <Image src={userImage} alt={userName} width={38} height={38} style={{ borderRadius: "8px" }} />
                  ) : (
                    userInitials
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: "var(--cream)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    color: "var(--muted)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    setComposerType(undefined);
                    setIsComposerOpen(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(232,98,26,.25)";
                    e.currentTarget.style.background = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--cream)";
                  }}
                >
                  Share something with {primaryCircle.name}...
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "0 16px 12px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { icon: "📷", label: "Photo", color: "var(--green)", hoverBg: "var(--green-light)" },
                  { icon: "📍", label: "Meetup", color: "var(--saffron)", hoverBg: "var(--saffron-light)" },
                  { icon: "💡", label: "Tip", color: "var(--saffron-dark)", hoverBg: "var(--saffron-light)" },
                  { icon: "🔧", label: "Service", color: "var(--saffron)", hoverBg: "var(--saffron-light)" },
                  { icon: "🚨", label: "SOS", color: "var(--color-danger)", hoverBg: "var(--color-danger-light)", sos: true },
                ].map((action) => (
                  <button
                    key={action.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 14px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "1.5px solid var(--border)",
                      background: "white",
                      transition: "all 0.15s",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: action.color,
                      borderColor: action.sos ? "rgba(239,68,68,.2)" : action.color === "var(--saffron)" || action.color === "var(--saffron-dark)" ? "rgba(232,98,26,.2)" : "var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.background = action.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.background = "white";
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const typeMap: Record<string, CommunityPostType> = {
                        Photo: CommunityPostType.GENERAL,
                        Meetup: CommunityPostType.MEETUP,
                        Tip: CommunityPostType.GYAAN,
                        Service: CommunityPostType.JOB_SHARE,
                        SOS: CommunityPostType.SOS,
                      };
                      setComposerType(typeMap[action.label] || CommunityPostType.GENERAL);
                      setIsComposerOpen(true);
                    }}
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div
            style={{
              display: "flex",
              gap: "7px",
              marginBottom: "16px",
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            {[
              { id: "all", label: "🔥 All" },
              { id: "SOS", label: "🚨 SOS" },
              { id: "EVENT_SHARE", label: "🎉 Events" },
              { id: "MEETUP", label: "📍 Meetups" },
              { id: "GYAAN", label: "💡 Gyaan" },
              { id: "JOB_SHARE", label: "🔧 Services" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 14px",
                  borderRadius: "100px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.18s",
                  border: "1.5px solid var(--border)",
                  background: activeFilter === filter.id ? "var(--saffron)" : "white",
                  color: activeFilter === filter.id ? "white" : "var(--muted)",
                  borderColor: activeFilter === filter.id ? "var(--saffron)" : "var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter.id) {
                    e.currentTarget.style.borderColor = "var(--saffron)";
                    e.currentTarget.style.color = "var(--saffron)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter.id) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--muted)";
                  }
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Feed Posts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {error && (
              <div
                style={{
                  borderRadius: "16px",
                  border: "1px solid var(--color-danger)",
                  background: "var(--color-danger-light)",
                  color: "var(--color-danger)",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "12px 16px",
                }}
              >
                {error}
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "white",
                      borderRadius: "16px",
                      border: "1.5px solid var(--border)",
                      padding: "18px",
                      height: "200px",
                    }}
                  />
                ))}
              </div>
            )}

            {feed.length === 0 && !loading ? (
              <div
                style={{
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  padding: "32px",
                  textAlign: "center",
                  background: "white",
                  color: "var(--muted)",
                }}
              >
                No posts yet. Be the first to share!
              </div>
            ) : (
              feed.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onReply={handleReply}
                  onShare={handleShare}
                  isLiked={likedPosts.has(post.id) || (post.likes && post.likes.length > 0)}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div
          style={{
            width: "300px",
            padding: "20px 16px",
            position: "sticky",
            top: "58px",
            height: "calc(100vh - 58px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: "var(--white)",
          }}
        >
          {/* Active SOS Widget */}
          {activeSOS.length > 0 && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "7px" }}>
                  🚨 Active SOS{" "}
                  <span
                    style={{
                      background: "var(--color-danger)",
                      color: "white",
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "10px",
                      marginLeft: "4px",
                    }}
                  >
                    {activeSOS.length} live
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--saffron)",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveFilter("SOS")}
                >
                  See all
                </div>
              </div>
              <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeSOS.map((sos: any) => {
                  const author = sos.author || {};
                  const authorName = author.name || "Anonymous";
                  const sosContent = sos.content || "";
                  const createdAt = sos.createdAt ? new Date(sos.createdAt) : new Date();
                  const timeAgo = Math.floor((Date.now() - createdAt.getTime()) / 60000);
                  
                  return (
                    <div
                      key={sos.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "9px",
                        padding: "9px 11px",
                        borderRadius: "10px",
                        background: "var(--color-danger-light)",
                        border: "1px solid rgba(239,68,68,.12)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(239,68,68,.3)";
                      }}
                      onClick={() => router.push(`/community/post/${sos.id}`)}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--color-danger)",
                          flexShrink: 0,
                          marginTop: "4px",
                          animation: "blink 1.3s infinite",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--ink)" }}>{authorName}</div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", lineHeight: 1.5, marginTop: "2px" }}>
                          {sosContent.slice(0, 50)}...
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--color-danger)", fontWeight: 700, marginTop: "3px" }}>
                          ⏱ {timeAgo} min ago · 12 responding
                        </div>
                      </div>
                      <button
                        style={{
                          padding: "5px 10px",
                          borderRadius: "7px",
                          background: "var(--color-danger)",
                          color: "white",
                          fontSize: "10px",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          flexShrink: 0,
                          alignSelf: "center",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/community/post/${sos.id}`);
                        }}
                      >
                        Help
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Events Widget */}
          {upcomingEvents.length > 0 && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "7px" }}>
                  🎉 Upcoming Events
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--saffron)",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/events")}
                >
                  See all
                </div>
              </div>
              <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {upcomingEvents.map((event: any) => {
                  const eventDate = event.meetup?.meetupDate ? formatDate(event.meetup.meetupDate) : null;
                  const eventId = event.event?.id || event.eventId || event.id || event.meetup?.eventId;
                  
                  return (
                    <div
                      key={event.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        padding: "6px 0",
                        borderBottom: "1px solid rgba(226,232,240,.5)",
                      }}
                      onClick={() => {
                        if (eventId) {
                          router.push(`/events/${eventId}`);
                        } else {
                          router.push("/events");
                        }
                      }}
                    >
                      {eventDate && (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "9px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            background: "linear-gradient(135deg, var(--saffron-dark), var(--saffron))",
                          }}
                        >
                          <div style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", color: "white" }}>
                            {eventDate.month}
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 900, color: "white", lineHeight: 1 }}>
                            {eventDate.day}
                          </div>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {event.meetup?.title || event.content?.slice(0, 30) + "..."}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
                          {event.meetup?.location || "Location TBD"} · {event.meetup?.rsvpCount || 0} going
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "4px 9px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          border: "1.5px solid var(--border)",
                          background: "white",
                          color: "var(--muted)",
                          cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--saffron)";
                          e.currentTarget.style.color = "var(--saffron)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--muted)";
                        }}
                      >
                        RSVP
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Online Now Widget */}
          {onlineUsers.length > 0 && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "7px" }}>
                  🟢 Online Now{" "}
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", marginLeft: "4px" }}>
                    {onlineUsers.length} active
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--saffron)",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(primaryCircle ? `/community/${primaryCircle.id}/members` : "/people")}
                >
                  See all
                </div>
              </div>
              <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {onlineUsers.map((user: any) => {
                  const userId = user.user?.id || user.id;
                  const userName = user.user?.name || user.name || "Anonymous";
                  const userImage = user.user?.image || user.image;
                  const profile = user.user?.profile || user.profile || {};
                  const initials = getUserInitials(userName);
                  
                  if (userId === session?.user?.id) return null;
                  
                  return (
                    <div
                      key={userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        cursor: "pointer",
                        padding: "4px 0",
                      }}
                      onClick={() => router.push(`/profile/${userId}`)}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "9px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "white",
                          flexShrink: 0,
                          position: "relative",
                          background: userImage
                            ? "transparent"
                            : "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                          overflow: "hidden",
                        }}
                      >
                        {userImage ? (
                          <Image src={userImage} alt={userName} width={32} height={32} style={{ borderRadius: "7px" }} />
                        ) : (
                          initials
                        )}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "1px",
                            right: "1px",
                            width: "9px",
                            height: "9px",
                            borderRadius: "50%",
                            background: "var(--green)",
                            border: "2px solid white",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{userName}</div>
                        <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                          {profile.profession || "Helper"} · {getStateEmoji(profile.nativePlaceState)} {profile.nativePlaceState || "State"}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <ConnectButton userId={userId} userName={userName} variant="member-list" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Helpers Widget */}
          {topHelpers.length > 0 && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "7px" }}>
                  ⭐ Top Helpers This Week
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--saffron)",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(primaryCircle ? `/community/${primaryCircle.id}/leaderboard` : "/community")}
                >
                  View all
                </div>
              </div>
              <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {topHelpers.map((entry, idx) => {
                  const user = entry.user || {};
                  const userName = user.name || "Anonymous";
                  const initials = getUserInitials(userName);
                  const rankColors = ["var(--saffron)", "var(--muted)", "var(--gold)"];
                  
                  return (
                    <div
                      key={entry.id || idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        padding: "5px 0",
                        borderBottom: "1px solid rgba(226,232,240,.4)",
                        cursor: "pointer",
                      }}
                      onClick={() => router.push(`/profile/${user.id}`)}
                    >
                      <div
                        style={{
                          width: "18px",
                          fontSize: "11px",
                          fontWeight: 800,
                          color: rankColors[idx] || rankColors[0],
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {entry.rankIcon || (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉")}
                      </div>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "9px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "white",
                          flexShrink: 0,
                          background: "linear-gradient(135deg, var(--saffron), var(--saffron-dark))",
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{userName}</div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
                          {entry.score || 0} helps · {getStateEmoji(user.profile?.nativePlaceState)} {user.profile?.nativePlaceState || "State"}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "9px",
                          fontWeight: 700,
                          background: "var(--saffron-light)",
                          color: "var(--saffron-dark)",
                        }}
                      >
                        {entry.badgeLabel || entry.category || "Helper"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested Connections Widget */}
          {suggestedConnections.length > 0 && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "14px",
                border: "1.5px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px 8px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: "7px" }}>
                  🤝 People You May Know
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--saffron)",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push(primaryCircle ? `/community/${primaryCircle.id}/members` : "/people")}
                >
                  See all
                </div>
              </div>
              <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {suggestedConnections.map((user: any) => {
                  const userId = user.user?.id || user.id;
                  const userName = user.user?.name || user.name || "Anonymous";
                  const userImage = user.user?.image || user.image;
                  const profile = user.user?.profile || user.profile || {};
                  const initials = getUserInitials(userName);
                  
                  if (userId === session?.user?.id) return null;
                  
                  return (
                    <div
                      key={userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        padding: "5px 0",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "9px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "white",
                          flexShrink: 0,
                          background: userImage
                            ? "transparent"
                            : "linear-gradient(135deg, var(--green), var(--green-dark))",
                          overflow: "hidden",
                        }}
                      >
                        {userImage ? (
                          <Image src={userImage} alt={userName} width={34} height={34} style={{ borderRadius: "7px" }} />
                        ) : (
                          initials
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{userName}</div>
                        <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
                          {profile.profession || "Member"} · {getStateEmoji(profile.nativePlaceState)} {profile.nativePlaceState || "State"} · {profile.currentCity || "City"}
                        </div>
                        <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--saffron)", marginTop: "2px" }}>
                          3 mutual connections
                        </div>
                      </div>
                      <button
                        style={{
                          padding: "5px 10px",
                          borderRadius: "7px",
                          fontSize: "10px",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          background: "var(--saffron)",
                          color: "white",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--saffron-dark)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--saffron)";
                        }}
                      >
                        + Connect
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Composer Modal */}
      {primaryCircle && (
        <PostComposerModal
          isOpen={isComposerOpen}
          onClose={() => {
            setIsComposerOpen(false);
            setComposerType(undefined);
          }}
          circleId={primaryCircle.id}
          circleName={primaryCircle.name}
          onPostCreated={handlePostCreated}
          initialType={composerType}
          allowGlobal={true}
        />
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

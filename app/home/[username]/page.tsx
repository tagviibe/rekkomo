"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineHeart,
  HiOutlineBookmark,
  HiOutlineShare,
  HiOutlineFlag,
  HiOutlinePlus,
  HiOutlineHome,
  HiOutlineCog6Tooth,
  HiOutlineBell,
  HiOutlineUserGroup,
  HiOutlineSparkles,
} from "react-icons/hi2";

type FeedPost = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  createdAt: string;
  locationContext?: string | null;
  type: string;
  tags?: string[];
  author?: { id: string; name?: string | null; image?: string | null };
  community?: { name?: string | null; slug?: string | null } | null;
  _count?: { reactions: number; comments: number };
};

const TABS = ["For You", "Help", "Housing", "Jobs", "Events"];
const TYPE_MAP: Record<string, string> = {
  Help: "HELP",
  Housing: "RESOURCE",
  Jobs: "QUESTION",
  Events: "GENERAL",
};

const POST_TYPES = [
  "Help",
  "Housing",
  "Job",
  "Event",
  "Service",
  "Story",
];

export default function HomeFeedPage() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("For You");
  const [feedMode, setFeedMode] = useState<"For You" | "Following">("For You");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [community, setCommunity] = useState("All communities");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [suggested, setSuggested] = useState<
    { name: string; slug: string }[]
  >([]);
  const [peopleSuggestions, setPeopleSuggestions] = useState<
    { id: string; name: string | null; title?: string | null }[]
  >([]);
  const [trendingTopics, setTrendingTopics] = useState<
    { label: string; count: number }[]
  >([]);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [toast, setToast] = useState<string | null>(null);
  const [profileMeta, setProfileMeta] = useState<{
    interests: string[];
    needs: string[];
    currentCity: string | null;
  } | null>(null);

  const fetchPosts = async () => {
    if (status === "unauthenticated") return;
    setLoading(true);
    const endpoint =
      feedMode === "Following" ? "/api/activity/following" : "/api/posts/feed";
    const res = await fetch(endpoint, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPosts(data.items ?? []);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to load feed");
    }
    setLoading(false);
  };

  const fetchSuggested = async () => {
    const res = await fetch("/api/communities?query=&page=1");
    if (res.ok) {
      const data = await res.json();
      const names = (data.items ?? [])
        .slice(0, 5)
        .map((item: { name: string; slug: string }) => ({
          name: item.name,
          slug: item.slug,
        }));
      setSuggested(names);
    }
  };

  const fetchPeopleSuggestions = async () => {
    const res = await fetch("/api/people/suggestions?limit=5");
    if (res.ok) {
      const data = await res.json();
      const items = (data.items ?? []).map(
        (item: { user: { id: string; name: string | null } }) => ({
          id: item.user.id,
          name: item.user.name,
          title: "Community helper",
        })
      );
      setPeopleSuggestions(items);
    }
  };

  const fetchTrendingTopics = async () => {
    const res = await fetch("/api/posts/feed");
    if (res.ok) {
      const data = await res.json();
      const counts = (data.items ?? []).reduce(
        (acc: Record<string, number>, post: { type: string }) => {
          acc[post.type] = (acc[post.type] || 0) + 1;
          return acc;
        },
        {}
      );
      const mapped = (Object.entries(counts) as Array<[string, number]>)
        .map(([label, count]) => ({
          label:
            label.toLowerCase() === "help"
              ? "Help"
              : label.toLowerCase() === "resource"
              ? "Housing"
              : label.toLowerCase() === "question"
              ? "Jobs"
              : label.toLowerCase() === "general"
              ? "Events"
              : label,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      setTrendingTopics(mapped);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (status === "unauthenticated") {
        router.replace("/auth/signin?callback=/home");
        return;
      }
      if (status === "authenticated") {
        const res = await fetch("/api/profile/me");
        if (res.ok) {
          const data = await res.json();
          if (!data.profile?.onboardingCompleted) {
            router.replace("/onboarding");
            return;
          }
          setProfileMeta({
            interests: data.profile?.interests ?? [],
            needs: data.profile?.needs ?? [],
            currentCity: data.profile?.currentCity ?? null,
          });
          if (data.user?.username && data.user.username !== params.username) {
            router.replace(`/home/${data.user.username}`);
            return;
          }
        }
        setCheckedOnboarding(true);
        fetchPosts();
        fetchSuggested();
        fetchPeopleSuggestions();
        fetchTrendingTopics();
      }
    };
    run();
  }, [feedMode, status, router, params.username]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/geo/reverse?lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.label) {
              setLocation(data.label);
              return;
            }
          }
        } catch {
          // ignore
        }
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("savedPosts");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        setSavedIds(new Set(parsed));
      } catch {
        localStorage.removeItem("savedPosts");
      }
    }
  }, []);

  const filteredPosts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filterType = TYPE_MAP[activeTab];
    const base = posts.filter((post) => {
      const matchesType = filterType ? post.type === filterType : true;
      const matchesSearch = normalized
        ? post.title.toLowerCase().includes(normalized) ||
          post.body.toLowerCase().includes(normalized)
        : true;
      const matchesLocation = location
        ? (post.locationContext ?? "")
            .toLowerCase()
            .includes(location.toLowerCase()) ||
          location
            .toLowerCase()
            .includes((post.locationContext ?? "").toLowerCase())
        : true;
      return matchesType && matchesSearch && matchesLocation;
    });
    if (activeTab !== "For You" || !profileMeta) {
      return base;
    }
    const needs = new Set(profileMeta.needs.map((n) => n.toLowerCase()));
    const interests = new Set(profileMeta.interests.map((n) => n.toLowerCase()));
    const city = profileMeta.currentCity?.toLowerCase();
    return [...base].sort((a, b) => {
      const score = (post: FeedPost) => {
        let s = 0;
        const tags = (post.tags ?? []).map((t) => t.toLowerCase());
        tags.forEach((tag) => {
          if (needs.has(tag)) s += 3;
          if (interests.has(tag)) s += 2;
        });
        const type = post.type.toLowerCase();
        if (needs.has("housing/roommates") && type === "resource") s += 2;
        if (needs.has("job opportunities") && type === "question") s += 2;
        if (needs.has("community events") && type === "general") s += 2;
        if (city && (post.locationContext ?? "").toLowerCase().includes(city)) s += 1;
        return s;
      };
      return score(b) - score(a);
    });
  }, [posts, activeTab, search, location]);

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.share) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
      setTimeout(() => setToast(null), 1200);
    }
  };

  const toggleSave = (postId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      localStorage.setItem("savedPosts", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const submitReport = async () => {
    if (!reportingId) return;
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "POST",
        targetId: reportingId,
        reason: reportReason,
      }),
    });
    if (res.ok) {
      setToast("Report submitted");
      setReportingId(null);
      setTimeout(() => setToast(null), 1200);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Report failed");
    }
  };

  if (status === "loading" || (status === "authenticated" && !checkedOnboarding)) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-slate-600">Checking your session...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-sm text-slate-600">Redirecting to login...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr_260px]">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4">
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "Profile"}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {(session?.user?.name ?? session?.user?.username ?? "U")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">
                  {session?.user?.name ?? session?.user?.username ?? "Member"}
                </p>
                <Link href="/profile/me" className="text-xs text-slate-500">
                  View profile
                </Link>
              </div>
            </div>
            <Link
              href="/profile/me"
              className="mt-4 block w-full rounded-lg border px-3 py-2 text-center text-sm"
            >
              Edit profile
            </Link>
          </div>
          <nav className="space-y-2 rounded-2xl border bg-white p-4 text-sm text-slate-600">
            <Link
              href="/home"
              className="flex w-full items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-blue-700"
            >
              <HiOutlineHome /> Home
            </Link>
            <Link
              href="/people"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2"
            >
              <HiOutlineUserGroup /> People
            </Link>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2">
              <HiOutlineBell /> Notifications
            </button>
            <Link
              href="/profile/me"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2"
            >
              <HiOutlineCog6Tooth /> Settings
            </Link>
          </nav>
            <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">Suggested</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {suggested.length === 0 && (
                <div className="rounded-lg border bg-slate-50 px-3 py-2 text-slate-500">
                  No suggestions yet
                </div>
              )}
              {suggested.map((item) => (
                <Link
                  key={item.slug}
                  href={`/communities/${item.slug}`}
                  className="block rounded-lg border bg-slate-50 px-3 py-2 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
                <HiOutlineMapPin className="text-slate-500" />
                {location || "Set location"}
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
                <HiOutlineUsers className="text-slate-500" />
                {community}
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
                <HiOutlineMagnifyingGlass className="text-slate-500" />
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Search posts, tags, or people"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 rounded-full border bg-white p-1 text-xs">
                {["For You", "Following"].map((mode) => (
                  <button
                    key={mode}
                    className={`rounded-full px-3 py-1 ${
                      feedMode === mode ? "bg-blue-600 text-white" : "text-slate-600"
                    }`}
                    onClick={() => setFeedMode(mode as "For You" | "Following")}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 overflow-x-auto text-sm">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-full px-4 py-1.5 ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "border bg-white text-slate-600"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <section className="mt-6 space-y-6">
            {loading && (
              <div className="space-y-4">
                <div className="h-32 rounded-2xl border bg-white" />
                <div className="h-32 rounded-2xl border bg-white" />
              </div>
            )}
            {!loading && filteredPosts.length === 0 && (
              <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-600">
                No posts yet. Be the first to share something helpful.
              </div>
            )}
            {!loading &&
              filteredPosts.map((post) => (
                <article key={post.id} className="rounded-2xl border bg-white p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="rounded-full border px-3 py-1 text-xs text-blue-600">
                      {post.type}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/posts/${post.id}`} className="block">
                    <h2 className="mt-3 text-lg font-semibold">{post.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{post.body}</p>
                  </Link>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full border px-3 py-1">
                      <HiOutlineMapPin className="inline-block text-slate-500" />{" "}
                      {post.locationContext || "Location not set"}
                    </span>
                    <span className="rounded-full border px-3 py-1">
                      <HiOutlineUsers className="inline-block text-slate-500" />{" "}
                      {post.community?.name ?? "General"}
                    </span>
                  </div>
                  {post.imageUrl && (
                    <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl">
                      <Image
                        src={post.imageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <HiOutlineChatBubbleLeftEllipsis />{" "}
                      {post._count?.comments ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineHeart /> {post._count?.reactions ?? 0}
                    </span>
                <button
                  className="rounded-full border px-3 py-1"
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
                  Comment
                </button>
                <button
                  className="rounded-full border px-3 py-1"
                  onClick={() =>
                    post.author?.id
                      ? router.push(`/profile/${post.author.id}`)
                      : undefined
                  }
                >
                  DM
                </button>
                <button
                  className="flex items-center gap-1 rounded-full border px-3 py-1"
                  onClick={() => toggleSave(post.id)}
                >
                      <HiOutlineBookmark /> Save
                    </button>
                <button
                  className="flex items-center gap-1 rounded-full border px-3 py-1"
                  onClick={() => handleShare(post.id)}
                >
                      <HiOutlineShare /> Share
                    </button>
                <button
                  className="flex items-center gap-1 rounded-full border px-3 py-1"
                  onClick={() => setReportingId(post.id)}
                >
                      <HiOutlineFlag /> Report
                    </button>
                {savedIds.has(post.id) && (
                  <span className="text-xs text-blue-600">Saved</span>
                )}
                  </div>
                </article>
              ))}
          </section>
        </section>

        <aside className="hidden lg:block">
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Trending Topics</p>
                <HiOutlineSparkles className="text-blue-600" />
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {trendingTopics.length === 0 && (
                  <div className="text-xs text-slate-400">No data yet</div>
                )}
                {trendingTopics.map((topic) => (
                  <div key={topic.label} className="flex items-center justify-between">
                    <span>{topic.label}</span>
                    <span className="text-xs text-slate-400">{topic.count} posts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm font-semibold">Who to follow</p>
              <div className="mt-3 space-y-3">
                {peopleSuggestions.length === 0 && (
                  <div className="text-xs text-slate-400">No suggestions yet</div>
                )}
                {peopleSuggestions.map((person) => (
                  <div key={person.id} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100" />
                    <div className="text-sm">
                      <p className="font-semibold">{person.name ?? "Member"}</p>
                      <p className="text-xs text-slate-500">{person.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg border px-3 py-2 text-sm">
                See more
              </button>
            </div>
          </div>
        </aside>
      </div>

      <button
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg"
        onClick={() => setPickerOpen(true)}
        aria-label="Create post"
      >
        <HiOutlinePlus />
      </button>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create post</h3>
              <button
                className="rounded-full border px-3 py-1 text-sm"
                onClick={() => setPickerOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {POST_TYPES.map((type) => (
                <Link
                  key={type}
                  href={`/posts/create?type=${encodeURIComponent(type)}`}
                  className="rounded-xl border bg-slate-50 px-3 py-4 text-center"
                  onClick={() => setPickerOpen(false)}
                >
                  {type}
                </Link>
              ))}
            </div>
            {!session?.user && (
              <p className="mt-3 text-xs text-slate-500">
                Sign in to publish posts.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-24 right-6 rounded-lg bg-white px-4 py-2 text-sm text-red-600 shadow">
          {error}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-16 right-6 rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow">
          {toast}
        </div>
      )}

      {reportingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <h3 className="text-lg font-semibold">Report post</h3>
            <div className="mt-4 space-y-2 text-sm">
              {["Scam", "Abuse", "Spam"].map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={reportReason === item}
                    onChange={() => setReportReason(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={() => setReportingId(null)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                onClick={submitReport}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  TbBrandTelegram,
  TbShieldCheck,
  TbUsersGroup,
  TbHome,
  TbBriefcase,
  TbBowlChopsticks,
  TbTruckDelivery,
  TbTools,
  TbSearch,
  TbMessageCircle,
  TbHeartHandshake,
  TbMapPin,
  TbCheck,
} from "react-icons/tb";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#communities", label: "Communities" },
  { href: "#safety", label: "Safety" },
  { href: "#about", label: "About" },
];

const TRUST_METRICS = [
  { label: "12,000+ members" },
  { label: "15 cities" },
  { label: "25k+ questions answered" },
  { label: "Verified community" },
];

const CITY_PILLS = ["Hyderabad", "Bengaluru", "Mumbai", "Bhubaneswar", "+ more"];

const ACTIVITY_ITEMS = [
  {
    badge: "Housing",
    title: "Looking for a 2BHK near HSR Layout",
    time: "2m ago",
    replies: 4,
  },
  {
    badge: "Service",
    title: "Need a carpenter in Miyapur",
    time: "12m ago",
    replies: 3,
  },
  {
    badge: "Event",
    title: "Odia community meetup this Sunday",
    time: "1h ago",
    replies: 8,
  },
  {
    badge: "Help",
    title: "Best tiffin services in Whitefield?",
    time: "2h ago",
    replies: 6,
  },
];

const HOW_IT_WORKS = [
  {
    title: "Join your city",
    description: "Pick your city and communities that match your journey.",
    icon: TbUsersGroup,
  },
  {
    title: "Ask or browse",
    description: "Post what you need or explore trusted answers.",
    icon: TbSearch,
  },
  {
    title: "Connect safely",
    description: "Chat, share, and settle in with privacy controls.",
    icon: TbShieldCheck,
  },
];

const CATEGORIES = [
  {
    title: "Help & Support",
    description: "Ask questions and get real answers.",
    icon: TbHeartHandshake,
  },
  {
    title: "Housing & Roommates",
    description: "Find rooms, PGs, and flatmates.",
    icon: TbHome,
  },
  {
    title: "Jobs & Referrals",
    description: "Discover openings and referrals.",
    icon: TbBriefcase,
  },
  {
    title: "Tiffin / Home Food",
    description: "Affordable meals from local kitchens.",
    icon: TbBowlChopsticks,
  },
  {
    title: "Packers & Movers",
    description: "Move safely with recommended providers.",
    icon: TbTruckDelivery,
  },
  {
    title: "Local Services",
    description: "Plumber, electrician, tutor, salon & more.",
    icon: TbTools,
  },
];

const TESTIMONIALS = [
  {
    name: "Aparna S.",
    city: "Hyderabad",
    quote:
      "Rekkomo helped me find a flatmate and a tiffin service within a week.",
  },
  {
    name: "Ritesh M.",
    city: "Bengaluru",
    quote:
      "The community replies are fast and genuine. It feels like a safe group.",
  },
  {
    name: "Sneha P.",
    city: "Mumbai",
    quote:
      "I joined for housing help and ended up meeting people from my city.",
  },
];

type CommunityStats = {
  totalMembers: number;
  totalCommunities: number;
  totalPosts: number;
  totalCities: number;
  cities: string[];
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    author: string;
    authorImage?: string | null;
    community?: string | null;
    replies: number;
    reactions: number;
    createdAt: string;
  }>;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      // Redirect authenticated users to community feed (home page)
      router.replace("/community");
      return;
    }
    if (status === "unauthenticated") {
      // Redirect unauthenticated users to sign in
      router.replace("/auth/signin");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <p className="text-sm text-slate-600">Loading…</p>
      </main>
    );
  }

  if (status === "authenticated" || status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <Navbar />

      <main>
        <Hero stats={stats} />

        <HowItWorks />

        <section id="features" className="mt-16">
          <SectionHeading
            title="Everything you need to feel at home"
            subtitle="Support that feels human — from people who have been there."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </section>

        <section id="communities" className="mt-16">
          <SectionHeading
            title="Trusted voices across your city"
            subtitle="Follow people, communities, and topics that matter to you."
          />
          <div className="mt-8 space-y-4">
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <TbMessageCircle className="mt-1 text-gray-400" />
                Ask for help and get replies from nearby members
              </li>
              <li className="flex items-start gap-3">
                <TbHome className="mt-1 text-gray-400" />
                Find housing, jobs, tiffin, movers, and local services
              </li>
              <li className="flex items-start gap-3">
                <TbUsersGroup className="mt-1 text-gray-400" />
                Follow people and communities to stay updated
              </li>
            </ul>
          </div>
        </section>

        <section id="safety" className="mt-16">
          <SectionHeading
            title="Built for trust and safety"
            subtitle="Your profile, activity, and connections stay in your control."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <SafetyItem
              title="Privacy-first profiles"
              description="Control who can follow you and what details you share."
            />
            <SafetyItem
              title="Report + block controls"
              description="Instant reporting with community moderation."
            />
            <SafetyItem
              title="Guided safety tips"
              description="Know how to verify listings and avoid scams."
            />
          </div>
        </section>

        <section id="about" className="mt-16">
          <SectionHeading
            title="Community-first, always free"
            subtitle="Rekkomo is built for migrants by migrants — no paywalls."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-lg bg-gray-900 px-6 py-12 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold md:text-3xl">
              Find your people in minutes.
            </h2>
            <p className="mt-3 text-gray-300">
              Join your city community and get help, answers, and trusted connections.
            </p>
            <a
              href="/onboarding"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              Join Your City <TbBrandTelegram />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Hero({ stats }: { stats: CommunityStats | null }) {
  const totalMembers = stats?.totalMembers || 600000000;
  const totalCities = stats?.totalCities || 50;
  const totalCommunities = 28;

  return (
    <section
      className="py-20"
      style={{
        padding: "80px 40px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="mx-auto max-w-6xl"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
        }}
      >
        {/* Left Column */}
        <div>
          <div
            className="inline-flex items-center gap-2 mb-6"
            style={{
              background: "var(--saffron-light)",
              border: "1px solid rgba(232,98,26,0.2)",
              borderRadius: "100px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--saffron)",
              letterSpacing: "0.02em",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--saffron)",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            India&apos;s Migrant Community Platform
          </div>

          <h1
            className="mb-2"
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-2px",
              color: "var(--ink)",
            }}
          >
            <span
              className="font-devanagari block mb-2"
              style={{
                fontSize: "42px",
                fontWeight: 700,
                color: "var(--saffron)",
                letterSpacing: 0,
                lineHeight: 1.3,
              }}
            >
              अपना शहर
            </span>
            Find your people.
            <br />
            Find your place.
            <span
              className="block mt-3"
              style={{
                fontSize: "22px",
                fontWeight: 400,
                color: "var(--muted)",
                letterSpacing: "-0.5px",
              }}
            >
              Jobs · Services · Events · Community
            </span>
          </h1>

          <p
            className="mt-6 mb-9"
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "var(--muted)",
              maxWidth: "440px",
            }}
          >
            Connect with people from your own state, find trusted jobs and services,
            and celebrate your culture — wherever you are in India.
          </p>

          <div className="flex gap-3 flex-wrap items-center">
            <a
              href="/onboarding"
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              🚀 Join Your Circle <span>→</span>
            </a>
            <a
              href="/jobs"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              🔍 Browse Jobs
            </a>
          </div>

          <div
            className="flex gap-8 mt-10 pt-10"
            style={{
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                600<span style={{ color: "var(--saffron)" }}>M+</span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}
              >
                Migrants in India
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                <span style={{ color: "var(--saffron)" }}>{totalCommunities}</span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}
              >
                State Circles
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {totalCities}
                <span style={{ color: "var(--saffron)" }}>+</span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}
              >
                Cities Covered
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Visual */}
        <div className="relative">
          {/* Floating Success Card */}
          <div
            className="absolute -top-5 -right-5 z-10"
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 500,
              animation: "float 4s ease-in-out infinite",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "var(--green-light)" }}
            >
              ✅
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>Rajan got hired!</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                Construction Worker · Pune
              </div>
            </div>
          </div>

          {/* Map Card */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="h-48 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--blue-light) 0%, var(--saffron-light) 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(27,79,138,0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(27,79,138,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="text-7xl opacity-15">🗺️</div>
              {/* Map dots */}
              {[
                { top: "30%", left: "40%", color: "var(--saffron)", delay: "0s" },
                { top: "55%", left: "65%", color: "var(--blue-mid)", delay: "0.8s" },
                { top: "25%", left: "55%", color: "var(--green)", delay: "1.6s" },
                { top: "70%", left: "30%", color: "var(--saffron)", delay: "0.4s" },
                { top: "45%", left: "20%", color: "var(--gold)", delay: "1.2s" },
              ].map((dot, idx) => (
                <div
                  key={idx}
                  className="absolute w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{
                    top: dot.top,
                    left: dot.left,
                    background: dot.color,
                    borderColor: "white",
                    boxShadow: `0 0 0 4px ${dot.color}33`,
                    animation: `map-pulse 3s ease-in-out infinite ${dot.delay}`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Active Communities Near You
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { emoji: "🌾", name: "Bihar Circle", count: "4.2K", color: "var(--gold-light)", border: "var(--gold)", text: "#7A5800" },
                { emoji: "🏛️", name: "UP Circle", count: "6.8K", color: "var(--green-light)", border: "var(--green)", text: "#0F4028" },
                { emoji: "🌊", name: "Odisha Circle", count: "2.1K", color: "var(--blue-light)", border: "var(--blue)", text: "#0D2E52" },
                { emoji: "🐯", name: "Bengal Circle", count: "3.4K", color: "#FDE8E8", border: "#C43A3A", text: "#6B1414" },
                { emoji: "🏜️", name: "Rajasthan", count: "1.9K", color: "#F0E8FD", border: "#7E3AC4", text: "#3D1568" },
              ].map((chip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{
                    background: chip.color,
                    borderColor: chip.border,
                    color: chip.text,
                  }}
                >
                  {chip.emoji} {chip.name} · {chip.count}
                </div>
              ))}
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              in Pune, Maharashtra
            </div>
          </div>

          {/* Floating Event Card */}
          <div
            className="absolute -bottom-16 -left-8 z-10"
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: 500,
              animation: "float 4s ease-in-out infinite 2s",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "var(--saffron-light)" }}
            >
              📅
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>Chhath Puja 2025</div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                240 RSVPs · Pune
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes map-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>
    </section>
  );
}

type ActivityCardProps = {
  badge: string;
  title: string;
  time: string;
  replies: number;
};

function ActivityCard({ badge, title, time, replies }: ActivityCardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{badge}</span>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{replies} replies</span>
      </div>
    </div>
  );
}

type FloatingSuccessCardProps = {
  title: string;
  type: string;
  author: string;
  authorImage?: string | null;
  community?: string | null;
  replies: number;
  reactions: number;
  createdAt: string;
  delay: number;
};

function FloatingSuccessCard({
  title,
  type,
  author,
  authorImage,
  replies,
  reactions,
  createdAt,
}: FloatingSuccessCardProps) {
  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          {type === "RESOURCE" ? "Housing" : type === "QUESTION" ? "Jobs" : type === "GENERAL" ? "Event" : "Help"}
        </span>
        <span className="text-xs text-gray-400">{timeAgo(createdAt)}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">{title}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{author}</span>
        <span>{replies} replies</span>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section
      id="how"
      className="py-15"
      style={{
        padding: "60px 40px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div className="text-center mb-10">
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--saffron)",
            marginBottom: "10px",
          }}
        >
          How It Works
        </div>
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "var(--ink)",
          }}
        >
          Three simple steps
        </h2>
      </div>
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {[
          {
            emoji: "📍",
            step: "Step 1",
            title: "Join Your Circle",
            description:
              "Tell us your native state and current city. Instantly connect with thousands of people from your own community.",
            color: "var(--saffron)",
          },
          {
            emoji: "🤝",
            step: "Step 2",
            title: "Find Trusted Help",
            description:
              "Browse jobs, services, and events from verified community members. Every listing is trusted by your own people.",
            color: "var(--saffron)",
            highlighted: true,
          },
          {
            emoji: "🌟",
            step: "Step 3",
            title: "Grow Together",
            description:
              "Build your reputation, vouch for friends, celebrate festivals together. Your community, your strength.",
            color: "var(--blue)",
          },
        ].map((step, idx) => (
          <div
            key={idx}
            className="text-center rounded-2xl p-7 border"
            style={{
              background: step.highlighted
                ? "linear-gradient(135deg, var(--saffron), var(--saffron-dark))"
                : "white",
              border: "1px solid var(--border)",
              color: step.highlighted ? "white" : "var(--ink)",
              transform: step.highlighted ? "translateY(-8px)" : "none",
              boxShadow: step.highlighted
                ? "0 16px 48px rgba(232,98,26,0.25)"
                : "none",
            }}
          >
            <div
              className="text-5xl mb-4"
              style={{ marginBottom: "16px" }}
            >
              {step.emoji}
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: step.highlighted ? "rgba(255,255,255,0.7)" : step.color,
                marginBottom: "8px",
              }}
            >
              {step.step}
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                opacity: step.highlighted ? 0.85 : 1,
              }}
            >
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

type CategoryCardProps = {
  title: string;
  description: string;
  icon: typeof TbUsersGroup;
};

function CategoryCard({ title, description, icon: Icon }: CategoryCardProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
        <Icon className="text-xl" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </div>
  );
}

function TestimonialCard({
  name,
  city,
  quote,
}: {
  name: string;
  city: string;
  quote: string;
}) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
          {name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{city}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">"{quote}"</p>
    </div>
  );
}

function SafetyItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-6">
      <TbShieldCheck className="text-xl text-gray-700" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="mx-auto flex flex-col items-start justify-between gap-6 px-4 py-8 text-sm text-gray-600 max-w-4xl md:flex-row md:items-center">
        <div>
          <p className="text-base font-medium text-gray-900">Rekkomo</p>
          <p className="mt-1 text-sm text-gray-500">
            Community support for migrants — always free.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a className="hover:text-gray-900" href="/privacy">Privacy</a>
          <a className="hover:text-gray-900" href="/terms">Terms</a>
          <a className="hover:text-gray-900" href="/community-guidelines">Guidelines</a>
          <a className="hover:text-gray-900" href="/disclaimer">Disclaimer</a>
        </div>
      </div>
    </footer>
  );
}

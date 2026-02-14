"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.username) {
      router.replace(`/home/${session.user.username}`);
    }
  }, [status, session?.user?.username, router]);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <p className="text-sm text-slate-600">Loading…</p>
      </main>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
          <a className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#features">
            Features
          </a>
          <a className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#how">
            Communities
          </a>
          <a className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#safety">
            Safety
          </a>
          <a className="hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" href="#about">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/onboarding"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Get Started
          </a>
        </div>
      </header>

      <section className="mt-10 grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h1 className="text-3xl font-semibold md:text-5xl">
            Settle faster in a new city — with trusted people.
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Rekkomo helps migrants connect with communities, find housing and
            services, and get real answers from locals — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/onboarding"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white"
            >
              Get Started Free
            </a>
            <a
              href="#features"
              className="rounded-lg border px-5 py-2 text-sm"
            >
              Browse Communities
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
            {["Hyderabad", "Bengaluru", "Mumbai", "Bhubaneswar"].map((city) => (
              <span
                key={city}
                className="rounded-full border bg-white px-3 py-1"
              >
                {city}
              </span>
            ))}
          </div>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>✅ Ask for help and get replies from nearby members</li>
            <li>✅ Find housing, jobs, tiffin, movers, and local services</li>
            <li>✅ Follow people and communities to stay updated</li>
          </ul>
        </div>
        <div className="grid gap-4 rounded-2xl border bg-white p-6">
          {[
            { title: "Looking for a room in HSR Layout", tag: "Housing" },
            { title: "Need a carpenter in Miyapur", tag: "Service" },
            { title: "Odia community meetup this Sunday", tag: "Event" },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border bg-slate-50 p-4">
              <span className="text-xs font-semibold text-blue-600">
                {card.tag}
              </span>
              <p className="mt-2 text-sm font-semibold">{card.title}</p>
              <p className="mt-2 text-xs text-slate-500">
                See details → · 3 replies
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mt-14">
        <h2 className="text-2xl font-semibold">
          Everything you need to feel at home
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Help & Support", "Ask questions and get trusted answers"],
            ["Housing & Roommates", "Find rooms, PGs, and flatmates"],
            ["Jobs & Referrals", "Discover openings and referrals"],
            ["Tiffin / Home Food", "Find affordable food near you"],
            ["Packers & Movers", "Move safely with recommended providers"],
            ["Local Services", "Plumber, electrician, tutor, salon & more"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border bg-white p-4">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
        <a
          href="/onboarding"
          className="mt-6 inline-flex text-sm font-semibold text-blue-600"
        >
          Create your first post →
        </a>
      </section>

      <section id="how" className="mt-14">
        <h2 className="text-2xl font-semibold">How Rekkomo works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Choose your city & community",
            "Post what you need (or offer help)",
            "Connect via comments or DM and settle faster",
          ].map((step) => (
            <div key={step} className="rounded-xl border bg-white p-4">
              <p className="text-sm font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="safety" className="mt-14 rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-semibold">Built for trust</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Report and block suspicious users</li>
          <li>• Community guidelines to reduce scams</li>
          <li>• Privacy controls for your profile and activity</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Never share OTPs or pay advances without verification.
        </p>
      </section>

      <section id="about" className="mt-14 rounded-2xl border bg-white p-6">
        <h2 className="text-2xl font-semibold">About Rekkomo</h2>
        <p className="mt-3 text-sm text-slate-600">
          Rekkomo connects Indian migrants with local communities for help,
          resources, and trusted networks.
        </p>
      </section>
    </main>
  );
}

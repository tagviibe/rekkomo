"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import {
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

type Suggestion = {
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    currentCity: string | null;
    nativePlace: string | null;
    communities: string[];
  };
  score: number;
  reasons: string[];
};

type Person = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  currentCity: string | null;
  nativePlace: string | null;
  communities: string[];
};

export default function PeoplePage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [community, setCommunity] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/people/suggestions?limit=20");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.items ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const searchPeople = async () => {
    setSearching(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (community) params.set("community", community);
    const res = await fetch(`/api/people/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data.items ?? []);
    }
    setSearching(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
          <HiOutlineMapPin className="text-slate-500" />
          <input
            className="bg-transparent outline-none"
            placeholder="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
          <HiOutlineUsers className="text-slate-500" />
          <input
            className="bg-transparent outline-none"
            placeholder="Community"
            value={community}
            onChange={(event) => setCommunity(event.target.value)}
          />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm">
          <HiOutlineMagnifyingGlass className="text-slate-500" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search people"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button
          className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={searchPeople}
        >
          Search
        </button>
      </header>

      <section className="mt-8 space-y-6">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Suggested for you</h2>
          {loading && (
            <p className="mt-3 text-sm text-slate-500">Loading suggestions...</p>
          )}
          {!loading && suggestions.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No suggestions yet.</p>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {suggestions.map((item) => (
              <div key={item.user.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div>
                    <Link href={`/profile/${item.user.id}`} className="text-sm font-semibold">
                      {item.user.name ?? "Member"}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {item.user.currentCity ?? "City not set"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {item.reasons.join(" • ") || "Suggested for you"}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/profile/${item.user.id}`}
                    className="inline-flex rounded-lg border px-3 py-1 text-xs"
                  >
                    View profile
                  </Link>
                  <FollowButton userId={item.user.id} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Search results</h2>
          {searching && (
            <p className="mt-3 text-sm text-slate-500">Searching...</p>
          )}
          {!searching && searchResults.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No results.</p>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {searchResults.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div>
                    <Link href={`/profile/${item.id}`} className="text-sm font-semibold">
                      {item.name ?? "Member"}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {item.currentCity ?? "City not set"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {item.communities.slice(0, 3).map((c) => (
                    <span key={c} className="rounded-full border px-2 py-1">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/profile/${item.id}`}
                    className="inline-flex rounded-lg border px-3 py-1 text-xs"
                  >
                    View profile
                  </Link>
                  <FollowButton userId={item.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

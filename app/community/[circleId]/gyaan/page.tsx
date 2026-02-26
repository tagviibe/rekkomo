"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import GyaanEntry from "@/components/community/GyaanEntry";
import { TbSearch, TbPlus } from "react-icons/tb";

const CATEGORIES = [
  { id: "all", label: "📱 All", icon: "📱" },
  { id: "housing", label: "🏠 Housing", icon: "🏠" },
  { id: "legal", label: "⚖️ Legal", icon: "⚖️" },
  { id: "health", label: "🏥 Health", icon: "🏥" },
  { id: "work", label: "💼 Work", icon: "💼" },
  { id: "government", label: "🏛️ Government", icon: "🏛️" },
];

export default function CircleGyaanPage() {
  const params = useParams();
  const circleId = params.circleId as string;

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (circleId) {
      fetchGyaan();
    }
  }, [circleId, category]);

  const fetchGyaan = async () => {
    try {
      const url = new URL(`/api/community/circles/${circleId}/gyaan`, window.location.origin);
      if (category !== "all") url.searchParams.set("category", category);
      if (search) url.searchParams.set("search", search);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch gyaan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search) {
      const timer = setTimeout(() => fetchGyaan(), 300);
      return () => clearTimeout(timer);
    } else {
      fetchGyaan();
    }
  }, [search]);

  const pinnedEntries = entries.filter((e) => e.isPinned);
  const regularEntries = entries.filter((e) => !e.isPinned);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Apna Gyaan</h1>
          <p className="mt-1 text-gray-600">
            Community knowledge built by your own people
          </p>
        </div>

        {/* Search and Category Filter */}
        <div className="mb-6 space-y-4 rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <TbSearch className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tips..."
              className="flex-1 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  category === cat.id
                    ? "bg-[#2B4FD4] text-white"
                    : "border bg-gray-50 text-gray-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned Entries */}
        {pinnedEntries.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">📌 Pinned Tips</h2>
            <div className="space-y-4">
              {pinnedEntries.map((entry) => (
                <GyaanEntry key={entry.id} entry={entry} post={entry.post} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Entries */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">All Tips</h2>
          {regularEntries.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-gray-600">
              No tips yet. Be the first to share knowledge!
            </div>
          ) : (
            <div className="space-y-4">
              {regularEntries.map((entry) => (
                <GyaanEntry key={entry.id} entry={entry} post={entry.post} />
              ))}
            </div>
          )}
        </div>

        {/* Add Tip Button */}
        <button className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B4FD4] text-white shadow-lg">
          <TbPlus className="h-6 w-6" />
        </button>
      </main>
    </div>
  );
}

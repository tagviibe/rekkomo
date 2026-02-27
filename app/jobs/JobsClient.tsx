"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineLanguage,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { useSession } from "next-auth/react";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";

type JobPost = {
  id: string;
  title: string;
  skillCategory: string;
  payMin?: number | null;
  payMax?: number | null;
  location: string;
  languagePref: string[];
  statePref?: string | null;
  description?: string | null;
  createdAt: string;
  employer: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    profile: {
      nativePlaceState: string | null;
      trustScore: number;
    } | null;
  };
  applications: Array<{ id: string; status: string }>;
};

const JOB_CATEGORIES = [
  "All",
  "Construction",
  "Domestic Help",
  "Delivery",
  "Factory",
  "Sales",
  "Driver",
  "Cook",
  "Security",
  "Other",
];

export default function JobsClient() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("");
  const [userState, setUserState] = useState<string | null>(null);

  useEffect(() => {
    const initialState = searchParams.get("state");
    const initialQuery = searchParams.get("q");
    if (initialState) {
      setSelectedState(initialState);
    }
    if (initialQuery) {
      setSearch(initialQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.append("skillCategory", selectedCategory);
      }
      if (selectedState) {
        params.append("statePref", selectedState);
      }
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
      setLoading(false);
    };

    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        const res = await fetch("/api/profile/me");
        if (res.ok) {
          const data = await res.json();
          setUserState(data.profile?.nativePlaceState || null);
        }
      }
    };

    fetchUserProfile();
    fetchJobs();
  }, [selectedCategory, selectedState, session]);

  const filteredJobs = jobs.filter((job) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.skillCategory.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower)
    );
  });

  const hasCommunityBadge = (job: JobPost) => {
    return userState && job.employer.profile?.nativePlaceState === userState;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 bg-warm-paper min-h-screen">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left Sidebar - Filters */}
        <aside className="hidden lg:block">
          <div className="card-warm sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineFunnel className="text-saffron" />
              <h2 className="font-bold text-warm-gray-dark">Filters</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-gray-dark mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2 text-sm text-warm-gray-dark"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-gray-dark mb-2">
                  State Preference
                </label>
                <PlacesAutocomplete
                  value={selectedState}
                  onChange={setSelectedState}
                  placeholder="Filter by state"
                  type="state"
                  className="w-full rounded-lg border border-warm-paper-dark bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-warm-paper-dark">
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedState("");
                    setSearch("");
                  }}
                  className="w-full btn-outline text-sm py-2"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section>
          {/* Header with Banner */}
          {userState && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-saffron/20 to-gold/20 border-2 border-saffron/30 p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-saffron flex items-center justify-center text-white font-bold text-lg">
                  {userState[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-warm-gray-dark">
                    {userState} Community Jobs
                  </h2>
                  <p className="text-sm text-warm-gray">
                    Jobs posted by people from your state community
                  </p>
                </div>
              </div>
            </div>
          )}

          <header className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-warm-gray-dark">Jobs</h1>
              <Link href="/jobs/create" className="btn-primary text-sm">
                Post a Job
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 rounded-xl border border-warm-paper-dark bg-white px-4 py-3">
              <HiOutlineMagnifyingGlass className="text-warm-gray" />
              <input
                type="text"
                placeholder="Search jobs by title, skill, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-warm-gray-dark placeholder:text-warm-gray outline-none"
              />
            </div>
          </header>

          {/* Jobs List */}
          {loading ? (
            <div className="text-center py-12 text-warm-gray">Loading jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="card-warm p-8 text-center text-warm-gray">
              No jobs found. Try adjusting your filters or search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="card-warm block hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-saffron/15 flex items-center justify-center text-saffron font-bold flex-shrink-0">
                      <HiOutlineBriefcase />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-warm-gray-dark truncate">
                            {job.title}
                          </h3>
                          <p className="text-sm text-warm-gray">
                            {job.employer?.name || "Employer"} · {job.skillCategory}
                          </p>
                        </div>
                        {hasCommunityBadge(job) && (
                          <span className="badge badge-amber whitespace-nowrap">
                            🌾 Community
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-warm-gray">
                        <span className="inline-flex items-center gap-1">
                          <HiOutlineMapPin />
                          {job.location}
                        </span>
                        {job.languagePref?.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineLanguage />
                            {job.languagePref.slice(0, 2).join(", ")}
                          </span>
                        )}
                        {job.employer?.profile?.trustScore ? (
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineShieldCheck className="text-green-600" />
                            Trust {job.employer.profile.trustScore}
                          </span>
                        ) : null}
                      </div>

                      {(job.payMin || job.payMax) && (
                        <div className="mt-3 font-semibold text-forest-green">
                          ₹{job.payMin?.toLocaleString() || "—"}
                          {job.payMax ? ` – ₹${job.payMax.toLocaleString()}` : ""} / month
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


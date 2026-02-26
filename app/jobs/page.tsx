"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function JobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("");
  const [userState, setUserState] = useState<string | null>(null);

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
    <>
      <Navbar />
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
              <Link
                href="/jobs/create"
                className="btn-primary text-sm"
              >
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
                className="flex-1 bg-transparent outline-none text-warm-gray-dark placeholder-warm-gray"
              />
            </div>
          </header>

          {loading && (
            <div className="space-y-4">
              <div className="h-32 card-warm" />
              <div className="h-32 card-warm" />
            </div>
          )}

          {!loading && filteredJobs.length === 0 && (
            <div className="card-warm text-center py-12">
              <HiOutlineBriefcase className="h-16 w-16 text-warm-gray mx-auto mb-4" />
              <p className="text-warm-gray">No jobs found. Be the first to post one!</p>
            </div>
          )}

          <div className="space-y-4">
            {!loading &&
              filteredJobs.map((job) => (
                <article key={job.id} className="card-warm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold text-warm-gray-dark">
                          {job.title}
                        </h2>
                        {hasCommunityBadge(job) && (
                          <span className="badge-community text-xs">
                            {job.employer.profile?.nativePlaceState} Community
                          </span>
                        )}
                        {job.employer.profile?.trustScore && job.employer.profile.trustScore >= 40 && (
                          <span className="flex items-center gap-1 text-xs text-forest-green">
                            <HiOutlineShieldCheck className="h-4 w-4" />
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-warm-gray mb-3">
                        <span className="flex items-center gap-1">
                          <HiOutlineBriefcase className="text-deep-blue" />
                          {job.skillCategory}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="text-saffron" />
                          {job.location}
                        </span>
                        {job.payMin && job.payMax && (
                          <span className="font-semibold text-saffron-dark">
                            ₹{job.payMin.toLocaleString()} - ₹{job.payMax.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {job.languagePref.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.languagePref.map((lang) => (
                            <span
                              key={lang}
                              className="text-xs px-2 py-1 rounded-full bg-deep-blue/10 text-deep-blue border border-deep-blue/20"
                            >
                              <HiOutlineLanguage className="inline-block mr-1" />
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}

                      {job.description && (
                        <p className="text-sm text-warm-gray line-clamp-2 mb-3">
                          {job.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-warm-paper-dark">
                        <div className="flex items-center gap-2">
                          {job.employer.image ? (
                            <Image
                              src={job.employer.image}
                              alt={job.employer.name || "Employer"}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-saffron/20 flex items-center justify-center text-saffron-dark font-semibold text-xs">
                              {(job.employer.name || "E")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-warm-gray-dark">
                              {job.employer.name || "Employer"}
                            </p>
                            <p className="text-xs text-warm-gray">
                              {job.applications.length} application{job.applications.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="btn-primary text-sm px-6"
                        >
                          Apply Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>
      </main>
    </>
  );
}

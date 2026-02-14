export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="rounded-3xl border bg-white p-8 md:p-12">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Rekkomo community
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              Find your people, wherever you move
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              A social community platform for Indian migrants. Discover groups
              by origin and destination, ask questions, and connect with trusted
              locals who’ve been there.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/onboarding"
                className="rounded-lg bg-blue-600 px-5 py-2 text-white"
              >
                Get started
              </a>
              <a
                href="/auth/signin"
                className="rounded-lg border px-5 py-2"
              >
                Login
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-100" />
                <div className="h-8 w-8 rounded-full bg-amber-100" />
                <div className="h-8 w-8 rounded-full bg-sky-100" />
              </div>
              <span>2,300+ people joined this month</span>
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-6">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold text-blue-600">
                Trending now
              </p>
              <h3 className="mt-2 text-sm font-semibold">
                Indians in Dubai
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Tips for rentals, visas, and community meetups.
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>1.8k members</span>
                <span>Active today</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold text-blue-600">New post</p>
              <p className="mt-2 text-sm font-semibold">
                Looking for a 2 BHK near Kondapur
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Any verified brokers or listings to share?
              </p>
              <div className="mt-4 text-xs text-slate-500">
                24 likes · 6 replies
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-white p-4">
              <p className="text-xs font-semibold text-blue-600">Events</p>
              <p className="mt-2 text-sm font-semibold">
                Bengaluru Malayali meetup
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Sunday · Cubbon Park · 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold">Discover communities</h3>
          <p className="mt-2 text-sm text-slate-600">
            Search by origin, destination, language, or identity.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold">Ask for help</h3>
          <p className="mt-2 text-sm text-slate-600">
            Post questions and get local tips on housing and jobs.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold">Build trust</h3>
          <p className="mt-2 text-sm text-slate-600">
            Meet verified helpers and grow a safe local network.
          </p>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Ready to join your people?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your profile and start connecting in minutes.
            </p>
          </div>
          <a
            href="/onboarding"
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Create profile
          </a>
        </div>
      </section>
    </main>
  );
}

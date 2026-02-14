export default function CommunityDetailPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold">Community name</h1>
        <p className="mt-2 text-sm text-slate-600">
          Community description and quick stats
        </p>
      </header>
      <div className="mt-6 border-b">
        <button className="mr-4 border-b-2 border-blue-600 pb-2 font-medium">
          Feed
        </button>
        <button className="mr-4 pb-2 text-slate-500">About</button>
        <button className="mr-4 pb-2 text-slate-500">Events</button>
        <button className="pb-2 text-slate-500">Members</button>
      </div>
      <section className="mt-6 grid gap-4">
        <div className="rounded-xl border bg-white p-4">Post card</div>
        <div className="rounded-xl border bg-white p-4">Post card</div>
      </section>
    </main>
  );
}

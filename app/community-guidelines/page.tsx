export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Community Guidelines</h1>
      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <p>Rekkomo is built on trust.</p>

        <div>
          <h2 className="text-base font-semibold">Allowed:</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Genuine housing posts</li>
            <li>Real job referrals</li>
            <li>Helpful advice</li>
            <li>Community event sharing</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">Not Allowed:</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Scams</li>
            <li>Fake listings</li>
            <li>Harassment</li>
            <li>Hate speech</li>
            <li>Spam</li>
            <li>Advance payment fraud</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">Safety Tips:</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Never share OTPs</li>
            <li>Never pay deposits without verification</li>
            <li>Meet in public places when possible</li>
          </ul>
        </div>

        <p>Violations may lead to account suspension.</p>
      </section>
    </main>
  );
}

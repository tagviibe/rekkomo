export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-600">
        Effective Date: February 14, 2026
      </p>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">1. Acceptance</h2>
        <p>By using Rekkomo, you agree to these Terms.</p>
        <p>If you do not agree, please do not use the platform.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">2. Platform Purpose</h2>
        <p>
          Rekkomo is a community-based platform for migrants to connect and
          share information related to:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Housing</li>
          <li>Jobs</li>
          <li>Services</li>
          <li>Events</li>
          <li>Community support</li>
        </ul>
        <p>We are not a broker, employer, agent, or service provider.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">3. User Responsibilities</h2>
        <p>You agree to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide accurate information</li>
          <li>Not post false or misleading listings</li>
          <li>Not engage in scams or fraud</li>
          <li>Respect other users</li>
          <li>Not upload illegal content</li>
        </ul>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">4. No Guarantees</h2>
        <p>Rekkomo does not verify all listings or users.</p>
        <p>We do not guarantee:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Accuracy of housing listings</li>
          <li>Legitimacy of job postings</li>
          <li>Quality of services</li>
          <li>Safety of transactions</li>
        </ul>
        <p>Users must perform their own verification.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">5. Payments & Transactions</h2>
        <p>Rekkomo does not handle payments between users.</p>
        <p>Any transaction occurs directly between users.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">6. Content Ownership</h2>
        <p>You retain ownership of content you post.</p>
        <p>
          By posting, you grant Rekkomo a non-exclusive license to display and
          distribute it on the platform.
        </p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">7. Termination</h2>
        <p>We may suspend or terminate accounts that:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Violate guidelines</li>
          <li>Engage in fraud</li>
          <li>Harass others</li>
        </ul>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">8. Limitation of Liability</h2>
        <p>Rekkomo is not liable for:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Financial loss</li>
          <li>Fraud</li>
          <li>Personal disputes</li>
          <li>Service dissatisfaction</li>
        </ul>
        <p>Use the platform at your own risk.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">9. Governing Law</h2>
        <p>These terms are governed by the laws of India.</p>
      </section>
    </main>
  );
}

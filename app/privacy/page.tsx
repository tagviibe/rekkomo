export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-600">
        Effective Date: February 14, 2026
      </p>
      <p className="text-sm text-slate-600">Last Updated: February 14, 2027</p>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Introduction</h2>
        <p>
          Rekkomo (“we”, “our”, “us”) is a community platform that helps migrants
          connect with local communities, find housing, jobs, services, and
          trusted support.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, and protect your
          information when you use our website and services.
        </p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Information We Collect</h2>
        <div>
          <h3 className="font-semibold">a) Information You Provide</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number (if provided)</li>
            <li>Current city</li>
            <li>Native place</li>
            <li>Communities</li>
            <li>Interests</li>
            <li>Profile photo</li>
            <li>Posts, comments, messages</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">b) Automatically Collected Information</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>IP address</li>
            <li>Device type</li>
            <li>Browser type</li>
            <li>Usage activity (pages visited, interactions)</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">c) Optional Information</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Languages spoken</li>
            <li>Profession</li>
            <li>Profile preferences</li>
          </ul>
        </div>
      </section>


      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create and manage your account</li>
          <li>Show relevant posts and suggestions</li>
          <li>Enable friend suggestions and following</li>
          <li>Improve user experience</li>
          <li>Maintain safety and prevent fraud</li>
          <li>Communicate updates</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">4. Data Sharing</h2>
        <p>We may share information:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>With other users (profile details you choose to display)</li>
          <li>With service providers (hosting, analytics)</li>
          <li>If required by law</li>
        </ul>
        <p>We do not share your data for advertising resale.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Data Security</h2>
        <p>
          We implement reasonable technical and organizational measures to
          protect your data.
        </p>
        <p>However, no system is 100% secure.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Your Rights</h2>
        <p>You can:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Edit your profile</li>
          <li>Delete your account</li>
          <li>Control visibility settings</li>
          <li>Contact us to request data removal</li>
        </ul>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Account Deletion</h2>
        <p>
          You may request account deletion by contacting:
          <br />
          [your email here]
        </p>
        <p>
          Deleted accounts may be removed from active systems but retained in
          backups for a limited period.
        </p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Children’s Privacy</h2>
        <p>Rekkomo is not intended for users under 18 years of age.</p>
      </section>

      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <h2 className="text-base font-semibold">Changes to Policy</h2>
        <p>
          We may update this policy. Continued use of the platform means you
          accept the updated version.
        </p>
      </section>
    </main>
  );
}

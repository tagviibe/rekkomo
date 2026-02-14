export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Disclaimer</h1>
      <section className="mt-6 space-y-3 text-sm text-slate-700">
        <p>Rekkomo acts only as a communication platform.</p>
        <p>We:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Do not verify housing ownership</li>
          <li>Do not verify employers</li>
          <li>Do not guarantee service providers</li>
          <li>Are not responsible for private agreements between users</li>
        </ul>
        <p>
          Users are solely responsible for verifying listings and transactions.
        </p>

        <h2 className="text-base font-semibold">What You Still Need</h2>
        <p>Before going live:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Add company legal name</li>
          <li>Add registered address</li>
          <li>Add contact email</li>
          <li>Add grievance officer (recommended for India)</li>
          <li>Add data retention policy details</li>
        </ul>
      </section>
    </main>
  );
}

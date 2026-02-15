import { Suspense } from "react";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-sm text-slate-600">Loading onboarding...</p>
        </main>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}

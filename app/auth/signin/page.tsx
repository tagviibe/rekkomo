import { Suspense } from "react";
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-sm text-slate-600">Loading...</p>
        </main>
      }
    >
      <SignInClient />
    </Suspense>
  );
}

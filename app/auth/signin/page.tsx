import { Suspense } from "react";
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-primary-deep)" }}>
          <p className="text-sm text-white/70">Loading...</p>
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}

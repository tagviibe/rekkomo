"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthActions() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-xs text-slate-500">Checking session...</span>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <button
          className="rounded border px-3 py-1"
          onClick={() => signIn()}
        >
          Login
        </button>
        <a className="rounded bg-blue-600 px-3 py-1 text-white" href="/onboarding">
          Register
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <a className="text-slate-600" href="/profile/me">
        {session.user.name ?? session.user.email}
      </a>
      <button
        className="rounded border px-3 py-1"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Logout
      </button>
    </div>
  );
}

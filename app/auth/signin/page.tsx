"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") ?? "/home";

  const handleCredentials = async () => {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    window.location.href = callback;
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 overflow-hidden rounded-3xl border bg-white md:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-slate-900 p-8 text-white md:block">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900"
              />
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-200">
            Join Homely to connect with migrant communities, housing, jobs, and
            trusted local help.
          </p>
        </section>

        <section className="p-8 md:p-10">
          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Welcome back. Use your account to continue.
          </p>
          <div className="mt-6 space-y-4">
            <button
              type="button"
              className="w-full rounded-xl border px-4 py-2"
              onClick={() => signIn("google", { callbackUrl: callback })}
            >
              Continue with Google
            </button>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs text-slate-400">
                Email address
              </span>
              <input
                className="w-full rounded-xl border bg-white px-3 pb-2 pt-6 text-sm"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs text-slate-400">
                Password
              </span>
              <input
                className="w-full rounded-xl border bg-white px-3 pb-2 pt-6 text-sm"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Remember me
              </label>
              <span>Forgot password?</span>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white"
              onClick={handleCredentials}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
            <p className="text-xs text-slate-500">
              Don’t have an account?{" "}
              <a className="text-blue-600" href="/onboarding">
                Create account
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

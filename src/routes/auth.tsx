import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

/* ---------- icons ---------- */

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
    >
      <line x1="12" y1="4" x2="12" y2="14" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="12" y1="14" x2="12" y2="20" />
    </svg>
  );
}

/* ---------- page ---------- */

function Auth() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (result.success) {
        document.cookie = `vidview_token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        window.location.href = "/?welcome=true";
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        document.cookie = `vidview_token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        window.location.href = "/?welcome=true";
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800 antialiased">
      {/* ====== HEADER ====== */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="/"
            className="flex items-center gap-2 text-stone-900 hover:text-amber-700 transition-colors"
          >
            <CrossIcon className="h-6 w-6 text-amber-600" />
            <span className="text-lg font-bold tracking-tight">VidView</span>
          </a>
          <a
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            &larr; Back to Videos
          </a>
        </div>
      </header>

      {/* ====== FORM ====== */}
      <main className="mx-auto max-w-md px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
            Welcome to VidView
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Sign in to track your watch history and more.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5 shadow-sm">
            <button
              onClick={() => { setTab("signin"); setError(""); }}
              className={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
                tab === "signin"
                  ? "bg-white text-stone-800 shadow-sm ring-1 ring-stone-200"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`rounded-md px-6 py-2 text-sm font-medium transition-all duration-200 ${
                tab === "signup"
                  ? "bg-white text-stone-800 shadow-sm ring-1 ring-stone-200"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {tab === "signin" ? (
            <form onSubmit={handleSignIn}>
              <div className="mb-4">
                <label htmlFor="signin-email" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="signin-password" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label htmlFor="signup-name" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Name <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="signup-email" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="signup-password" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-stone-400">
            By creating an account, you agree to keep content focused on the Word and treat others with grace.
          </p>
        </div>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-stone-200 bg-white py-8 text-center">
        <p className="text-sm text-stone-400">
          &copy; 2026 VidView &mdash; Bringing Bible stories to life.
        </p>
      </footer>
    </div>
  );
}

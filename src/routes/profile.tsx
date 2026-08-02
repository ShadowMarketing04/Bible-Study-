import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

/* ---------- types ---------- */

interface WatchItem {
  youtube_id: string;
  title: string;
  channel: string;
  gradient: string;
  watched_at: string;
}

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

function Profile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string | null;
  } | null>(null);
  const [history, setHistory] = useState<WatchItem[]>([]);
  const [subscription, setSubscription] = useState<{ tier: string; active: boolean } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          window.location.href = "/auth";
          return;
        }
        const data = await response.json() as {
          user: { id: number; email: string; name: string | null } | null;
          history: WatchItem[];
        };
        if (!data.user) {
          window.location.href = "/auth";
          return;
        }
        setUser(data.user);
        setHistory(data.history);
        const subscriptionResponse = await fetch("/api/subscription");
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscription(subscriptionData.subscription ?? null);
        }
      } catch {
        window.location.href = "/auth";
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogout() {
    document.cookie = "vidview_token=; path=/; max-age=0";
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.name || "Viewer";

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

      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        {/* ====== PROFILE CARD ====== */}
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm mb-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-stone-900">{displayName}</h1>
                    {subscription?.active && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        {subscription.tier}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{user.email}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:text-stone-800 active:scale-[0.98]"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* ====== WATCH HISTORY ====== */}
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            Recently Watched
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            Videos you&apos;ve watched on VidView.
          </p>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <p className="text-stone-400">
                You haven&apos;t watched any videos yet.
              </p>
              <a
                href="/"
                className="mt-4 inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Browse videos &rarr;
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <a
                  key={`${item.youtube_id}-${item.watched_at}`}
                  href={`/?watch=${item.youtube_id}`}
                  className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-amber-300"
                >
                  {/* Thumbnail */}
                  <div
                    className={`relative h-16 w-28 shrink-0 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center overflow-hidden`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${item.youtube_id}/mqdefault.jpg`}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                    <svg
                      className="relative h-6 w-6 text-white/70 drop-shadow"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-stone-800">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500">{item.channel}</p>
                    <p className="mt-1 text-xs text-stone-400">
                      Watched{" "}
                      {new Date(item.watched_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-stone-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              ))}
            </div>
          )}
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

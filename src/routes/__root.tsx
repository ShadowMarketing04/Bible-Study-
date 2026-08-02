import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VidView — Views of the Word" },
      {
        name: "description",
        content:
          "Watch Bible story videos, track your progress through every book, and discover the most-viewed scripture content.",
      },
      // Open Graph / social sharing (og:url is static — the head() hook has no
      // request context here; update once a custom domain is live)
      { property: "og:title", content: "VidView — Views of the Word" },
      {
        property: "og:description",
        content:
          "Watch Bible story videos, track your progress through every book, and discover the most-viewed scripture content.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vidview-nxqq.onrender.com" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "VidView — Views of the Word" },
      {
        name: "twitter:description",
        content:
          "Watch Bible story videos, track your progress through every book, and discover the most-viewed scripture content.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
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

/* ---------- components ---------- */

function RootComponent() {
  return (
    <RootDocument>
      <TopNav />
      <Outlet />
    </RootDocument>
  );
}

function TopNav() {
  const [user, setUser] = useState<{
    id: number;
    email: string;
    name: string | null;
    subscription?: { tier: string; active: boolean } | null;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) return;
        fetch("/api/subscription")
          .then((r) => r.json())
          .then((subscription) => setUser({ ...d.user, subscription: subscription.subscription ?? null }))
          .catch(() => setUser(d.user));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const displayName = user?.name || "Profile";

  return (
    <nav className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a
          href="/"
          className="flex items-center gap-2 text-stone-900 hover:text-amber-700 transition-colors"
        >
          <CrossIcon className="h-5 w-5 text-amber-600" />
          <span className="text-base font-bold tracking-tight">VidView</span>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/upload"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:text-stone-800 hover:border-amber-300"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </a>
          <a
            href="/support"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 shadow-sm transition-all duration-200 hover:bg-rose-100 hover:text-rose-700"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Support
          </a>
          <a
            href="/pricing"
            className="hidden sm:inline-flex items-center rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 shadow-sm transition-all duration-200 hover:bg-amber-100"
          >
            Pricing
          </a>
          {loaded ? (
            user ? (
              <a
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 shadow-sm transition-all duration-200 hover:bg-amber-100"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{displayName}</span>
                {user.subscription?.active && (
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    {user.subscription.tier}
                  </span>
                )}
              </a>
            ) : (
              <a
                href="/auth"
                className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98]"
              >
                Sign In
              </a>
            )
          ) : (
            <div className="h-8 w-16 animate-pulse rounded bg-stone-100" />
          )}
        </div>
      </div>
    </nav>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

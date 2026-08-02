import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/pricing")({ component: Pricing });

type Subscription = { tier: string; status: string; active: boolean } | null;

function Pricing() {
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data) => setSubscription(data.subscription ?? null))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const isPro = subscription?.active;

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800 antialiased">
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">Go Pro</h1>
        <p className="mt-3 text-stone-500">
          Upgrade for an ad-free experience, offline downloads, and priority support.
        </p>

        {loaded && isPro && (
          <div className="mx-auto mt-6 inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
            You're on the Pro plan — thank you for supporting VidView!
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-amber-400 bg-gradient-to-b from-amber-100 to-amber-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-amber-800">VidView Pro</h2>
          <p className="mt-1 text-4xl font-extrabold text-stone-900">
            $9<span className="text-lg font-normal text-stone-500">/mo</span>
          </p>
          <p className="mt-2 text-sm text-stone-600">
            A focused, uninterrupted way to watch Bible stories.
          </p>
          <ul className="mt-6 space-y-3 text-left text-sm text-stone-700">
            {[
              "Ad-free viewing",
              "Download videos for offline",
              "Priority support",
            ].map((f) => (
              <li key={f} className="flex gap-2">
                <span className="font-bold text-amber-700">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="mt-6 w-full rounded-xl bg-white/70 px-4 py-2.5 text-sm font-semibold text-stone-500">
              Current plan
            </div>
          ) : (
            <a
              href="https://buy.stripe.com/6oUaEXbNy5ex3jq5ffdnW03"
              target="_blank"
              rel="noopener"
              className="mt-6 block w-full rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 hover:shadow-md active:scale-[0.98]"
            >
              Subscribe to Pro
            </a>
          )}
        </div>

        <p className="mt-8 text-xs text-stone-400">
          Secure recurring billing powered by Stripe. Cancel anytime.
        </p>
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/pricing")({ component: Pricing });

const tiers = [
  {
    name: "Free",
    price: "$0",
    suffix: "/mo",
    description: "A welcoming place to explore the Word.",
    features: ["Browse and watch all Bible videos", "Join the community"],
    gradient: "from-stone-100 to-stone-200",
    border: "border-stone-300",
    text: "text-stone-700",
    button: "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  },
  {
    name: "Pro",
    price: "$9",
    suffix: "/mo",
    description: "A focused, uninterrupted way to watch.",
    features: ["Everything in Free", "Ad-free viewing", "Download videos for offline", "Priority support"],
    gradient: "from-amber-100 to-amber-200",
    border: "border-amber-400",
    text: "text-amber-800",
    button: "bg-amber-600 text-white hover:bg-amber-700",
    link: "https://buy.stripe.com/PLACEHOLDER_PRO",
  },
  {
    name: "Creator",
    price: "$19",
    suffix: "/mo",
    description: "Powerful tools to share Bible stories widely.",
    features: ["Everything in Pro", "Advanced creator tools", "Analytics dashboard", "Featured placement"],
    gradient: "from-rose-100 to-rose-200",
    border: "border-rose-400",
    text: "text-rose-800",
    button: "bg-rose-600 text-white hover:bg-rose-700",
    link: "https://buy.stripe.com/PLACEHOLDER_CREATOR",
  },
];

type Subscription = { tier: "pro" | "creator"; status: string; active: boolean } | null;

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

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800 antialiased">
      <main className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">Plans for every journey</p>
        <h1 className="mt-3 text-3xl font-bold text-stone-900 sm:text-4xl">Bring the Word closer</h1>
        <p className="mx-auto mt-3 max-w-xl text-stone-500">Choose the VidView plan that fits how you watch, create, and share Bible stories.</p>
        {loaded && subscription?.active && (
          <div className="mx-auto mt-6 inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
            You&apos;re on the {subscription.tier} plan
          </div>
        )}
        <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-stretch">
          {tiers.map((tier) => {
            const isCurrent = subscription?.active && subscription.tier === tier.name.toLowerCase();
            return (
              <div key={tier.name} className={`flex flex-col rounded-2xl border ${tier.border} bg-gradient-to-b ${tier.gradient} p-6 text-left shadow-sm`}>
                <h2 className={`text-lg font-bold ${tier.text}`}>{tier.name}</h2>
                <div className="mt-3"><span className="text-4xl font-extrabold text-stone-900">{tier.price}</span><span className="text-sm text-stone-500">{tier.suffix}</span></div>
                <p className="mt-3 min-h-10 text-sm text-stone-600">{tier.description}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-stone-700">
                  {tier.features.map((feature) => <li key={feature} className="flex gap-2"><span className="font-bold text-amber-700">✓</span>{feature}</li>)}
                </ul>
                {tier.link ? (
                  isCurrent ? <div className="mt-6 w-full rounded-xl bg-white/70 px-4 py-2.5 text-center text-sm font-semibold text-stone-500">Current plan</div> :
                  <a href={tier.link} target="_blank" rel="noopener" className={`mt-6 w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold shadow-sm transition hover:shadow-md ${tier.button}`}>{subscription?.active ? "Switch plan" : "Subscribe"}</a>
                ) : <div className="mt-6 w-full rounded-xl border border-stone-300 bg-white/60 px-4 py-2.5 text-center text-sm font-semibold text-stone-600">Always free</div>}
              </div>
            );
          })}
        </div>
        <p className="mt-10 text-xs text-stone-400">Secure recurring billing powered by Stripe. Cancel anytime.</p>
      </main>
    </div>
  );
}

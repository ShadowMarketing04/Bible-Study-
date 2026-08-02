import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  component: Support,
});

const tiers = [
  {
    name: "Friend",
    price: "$5",
    description: "Every bit helps bring Bible stories to more people.",
    link: "https://buy.stripe.com/3cI7sLaJugXf2fm6jjdnW00",
    gradient: "from-stone-100 to-stone-200",
    text: "text-stone-700",
    border: "border-stone-300",
    button: "bg-stone-600 hover:bg-stone-700",
  },
  {
    name: "Generous",
    price: "$10",
    description: "A generous contribution that makes a real difference.",
    link: "https://buy.stripe.com/3cI8wPbNy9uNdY4azzdnW02",
    gradient: "from-amber-100 to-amber-200",
    text: "text-amber-800",
    border: "border-amber-400",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  {
    name: "Champion",
    price: "$25",
    description: "Champion-level support — you're spreading the Word far and wide.",
    link: "https://buy.stripe.com/bJe6oHg3O7mFaLScHHdnW01",
    gradient: "from-rose-100 to-rose-200",
    text: "text-rose-800",
    border: "border-rose-400",
    button: "bg-rose-600 hover:bg-rose-700",
  },
];

function Support() {
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800 antialiased">
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
          Support VidView
        </h1>
        <p className="mt-3 text-stone-500">
          Your support keeps Bible stories free and accessible for everyone.
          Choose a level that feels right.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border ${tier.border} bg-gradient-to-b ${tier.gradient} p-6 shadow-sm flex flex-col items-center`}
            >
              <h2 className={`text-lg font-bold ${tier.text}`}>{tier.name}</h2>
              <p className="mt-1 text-3xl font-extrabold text-stone-900">
                {tier.price}
              </p>
              <p className="mt-2 text-sm text-stone-500">{tier.description}</p>
              <a
                href={tier.link}
                target="_blank"
                rel="noopener"
                className={`mt-6 w-full rounded-xl ${tier.button} px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] text-center`}
              >
                Support {tier.price}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-stone-400">
          Secure payment powered by Stripe. You'll receive a receipt by email.
        </p>
      </main>
    </div>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/playlists")({
  loader: async () => {
    try {
      const base = typeof window === "undefined" ? "http://0.0.0.0:3000" : "";
      const response = await fetch(`${base}/api/playlists`);
      if (!response.ok) throw new Error(`Playlists request failed (${response.status})`);
      const data = (await response.json()) as { playlists?: PlaylistSummary[] };
      return { playlists: data.playlists ?? [] };
    } catch {
      // Keep the page renderable if the API is temporarily unavailable.
      return { playlists: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Playlists — VidView" },
      { property: "og:title", content: "Playlists — VidView" },
      {
        property: "og:description",
        content:
          "Curated collections of Bible story videos — the Pentateuch, the Gospels, and stories for kids.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vidview-nxqq.onrender.com/playlists" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Playlists — VidView" },
    ],
  }),
  component: PlaylistsPage,
});

/* ---------- types ---------- */

interface PlaylistSummary {
  id: string;
  name: string;
  description: string;
  videoCount: number;
}

/* ---------- constants ---------- */

// Clean gradient backgrounds cycled across playlist cards.
const CARD_GRADIENTS = [
  "from-amber-600 via-orange-500 to-rose-400",
  "from-sky-600 via-indigo-500 to-violet-400",
  "from-emerald-600 via-teal-500 to-cyan-400",
];

/* ---------- icons ---------- */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

/* ---------- page ---------- */

function PlaylistsPage() {
  const { playlists } = Route.useLoaderData();

  return (
    <main className="min-h-dvh bg-stone-50 px-6 py-12 text-stone-800 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Curated Collections
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Playlists
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-500 sm:text-base">
            Watch the Bible in order, or hand-picked stories for the whole
            family — each collection is shareable with its own preview card.
          </p>
        </div>

        {playlists.length === 0 ? (
          <p className="text-center text-sm text-stone-500">
            No playlists available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist, i) => {
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              return (
                <Link
                  key={playlist.id}
                  to="/playlist/$playlistId"
                  params={{ playlistId: playlist.id }}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition-all duration-200 hover:shadow-md hover:ring-amber-300"
                >
                  {/* gradient banner */}
                  <div
                    className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${gradient}`}
                  >
                    <PlayIcon className="h-12 w-12 text-white/70 transition-transform duration-200 group-hover:scale-110" />
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                      <ListIcon className="h-3 w-3" />
                      {playlist.videoCount}{" "}
                      {playlist.videoCount === 1 ? "video" : "videos"}
                    </span>
                  </div>
                  {/* info */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                      {playlist.name}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">
                      {playlist.description}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-amber-700">
                      View playlist →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/playlist/$playlistId")({
  loader: async ({ params }) => {
    try {
      const base = typeof window === "undefined" ? "http://0.0.0.0:3000" : "";
      const response = await fetch(`${base}/api/playlist/${params.playlistId}`);
      if (!response.ok) return { playlist: null, videos: [] };
      const data = (await response.json()) as {
        playlist?: Playlist;
        videos?: Video[];
      };
      return { playlist: data.playlist ?? null, videos: data.videos ?? [] };
    } catch {
      // Keep the page renderable if the API is temporarily unavailable.
      return { playlist: null, videos: [] };
    }
  },
  head: ({ loaderData }) => {
    const playlist = loaderData?.playlist;
    if (!playlist) return { meta: [{ title: "Playlist not found — VidView" }] };
    const firstVideo = loaderData?.videos?.[0];
    const title = `${playlist.name} — VidView Playlist`;
    const description = (playlist.description || "").slice(0, 200);
    const image = firstVideo?.youtubeId
      ? `https://img.youtube.com/vi/${firstVideo.youtubeId}/maxresdefault.jpg`
      : "https://vidview-nxqq.onrender.com/og-image.png";
    const url = `https://vidview-nxqq.onrender.com/playlist/${playlist.id}`;
    return {
      meta: [
        { title },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
    };
  },
  component: PlaylistPage,
});

/* ---------- types ---------- */

interface Playlist {
  id: string;
  name: string;
  description: string;
}

interface Video {
  id: number;
  title: string;
  book: string;
  channel: string;
  views: number;
  gradient: string;
  youtubeId: string;
  videoType: string;
  bookOrder: number;
  watched: boolean;
}

/* ---------- helpers ---------- */

function formatViews(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(n);
}

/* ---------- icons ---------- */

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

/* ---------- components ---------- */

// Inline copy of the homepage card markup — gradient placeholder, play icon,
// title, channel, views (plus the same type/watched badges).
function VideoCard({ video }: { video: Video }) {
  const viewsText = formatViews(video.views);
  // Best-effort view count, matching the homepage's view-driven discovery model.
  function handleClick() {
    fetch("/api/videos/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeId: video.youtubeId }),
    }).catch(() => {});
  }
  return (
    <Link
      to="/video/$videoId"
      params={{ videoId: String(video.id ?? video.bookOrder) }}
      onClick={handleClick}
      className="group block cursor-pointer rounded-xl bg-white text-left shadow-sm ring-1 ring-stone-200 transition-all duration-200 hover:shadow-md hover:ring-amber-300"
    >
      {/* thumbnail */}
      <div
        className={`relative aspect-video rounded-t-xl bg-gradient-to-br ${video.gradient} flex items-center justify-center`}
      >
        <PlayIcon className="h-10 w-10 text-white/70 transition-transform duration-200 group-hover:scale-110" />
        {video.videoType === "overview" && (
          <span className="absolute top-2 left-2 rounded bg-stone-900/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            Overview
          </span>
        )}
        {video.videoType === "story" && (
          <span className="absolute top-2 left-2 rounded bg-stone-900/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            Story
          </span>
        )}
        {video.videoType === "creator" && (
          <span className="absolute top-2 left-2 rounded bg-amber-600/80 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            Creator
          </span>
        )}
        {video.watched && (
          <span className="absolute top-2 right-2 rounded bg-emerald-600/80 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            ✓ Watched
          </span>
        )}
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {viewsText} views
        </span>
      </div>
      {/* info */}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-stone-800">
          {video.title}
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">{video.channel}</p>
        <p className="mt-1 text-xs font-bold text-amber-700">{viewsText} views</p>
      </div>
    </Link>
  );
}

/* ---------- page ---------- */

function PlaylistPage() {
  const { playlist, videos } = Route.useLoaderData();

  if (!playlist) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-stone-800">
        <Link
          to="/playlists"
          className="text-sm text-amber-700 hover:underline"
        >
          ← Back to playlists
        </Link>
        <h1 className="mt-12 text-2xl font-bold">Playlist not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-stone-50 px-6 py-10 text-stone-800 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/playlists"
          className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline"
        >
          ← Back to playlists
        </Link>

        {/* header */}
        <header className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-500 to-rose-400 p-8 text-white shadow-sm sm:p-10">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {playlist.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            {playlist.description}
          </p>
        </header>

        {/* video grid — same card markup as the homepage */}
        {videos.length === 0 ? (
          <p className="mt-12 text-center text-sm text-stone-500">
            No videos in this playlist yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.youtubeId} video={video} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

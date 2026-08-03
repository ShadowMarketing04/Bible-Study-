import { Link, createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/")({
  loader: async ({ location }) => {
    // TanStack Router exposes parsed search values as `location.search` in this
    // version (older code incorrectly used the non-existent `searchStr`). Keep
    // the string case too so this remains safe across SSR/router adapters.
    const locationSearch = location.search as unknown;
    let requestedBook: string | undefined;
    let requestedSort: "order" | "views" = "order";
    if (typeof locationSearch === "string") {
      const params = new URLSearchParams(locationSearch);
      requestedBook = params.get("book")?.trim() || undefined;
      requestedSort = params.get("sort") === "views" ? "views" : "order";
    } else if (locationSearch && typeof locationSearch === "object") {
      const search = locationSearch as { book?: unknown; sort?: unknown };
      requestedBook = typeof search.book === "string" ? search.book.trim() || undefined : undefined;
      requestedSort = search.sort === "views" ? "views" : "order";
    }

    try {
      const base = typeof window === "undefined" ? "http://0.0.0.0:3000" : "";
      const response = await fetch(`${base}/api/videos?sort=${requestedSort}`);
      if (!response.ok) throw new Error(`Video request failed (${response.status})`);
      const data = (await response.json()) as { videos?: Video[] };
      const videos = data.videos ?? [];
      const bookVideo = requestedBook
        ? videos.find((video) => {
            const book = video.book ?? video.title;
            return book.toLowerCase() === requestedBook.toLowerCase();
          }) ?? null
        : null;
      return { videos, bookVideo };
    } catch {
      // Keep the page renderable if the API is temporarily unavailable.
      return { videos: [], bookVideo: null };
    }
  },
  head: ({ loaderData }) => {
    const video = loaderData?.bookVideo;
    if (!video) return {};
    const book = video.book ?? video.title;
    const description = `Watch the ${book} overview on VidView — a 7-minute animated summary of the book of ${book}.`;
    const image = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
    const url = `https://vidview-nxqq.onrender.com/?book=${encodeURIComponent(book)}`;
    return { meta: [
      { title: `${book} — VidView` },
      { property: "og:title", content: `${book} — VidView` },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${book} — VidView` },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ] };
  },
  component: Home,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.uploaded;
    const bookRaw = search.book;
    const sortRaw = search.sort;
    const welcomeRaw = search.welcome;
    const watchRaw = search.watch;
    return {
      uploaded: raw === "true" || raw === true,
      book: typeof bookRaw === "string" && bookRaw.trim() ? bookRaw.trim() : undefined,
      sort: sortRaw === "views" ? ("views" as const) : ("order" as const),
      welcome: welcomeRaw === "true" || welcomeRaw === true,
      watch: typeof watchRaw === "string" ? watchRaw : undefined,
    };
  },
});

/* ---------- types ---------- */

interface Video {
  title: string;
  book: string;
  channel: string;
  views: number;
  gradient: string;
  youtubeId: string;
  id?: number;
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

/* ---------- constants ---------- */

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Upload Your Bible Story",
    description:
      "Share your animated retellings, narrated scripture, and visual devotionals with a community hungry for the Word.",
  },
  {
    step: 2,
    title: "Viewers Watch & Engage",
    description:
      "Every view counts. The more people watch your story, the higher it climbs — simple and transparent.",
  },
  {
    step: 3,
    title: "Rise to the Top",
    description:
      "The most-watched stories surface naturally. Great content rises on its own merit, not an algorithm.",
  },
];

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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

/* ---------- components ---------- */

function VideoCard({
  title,
  channel,
  views,
  gradient,
  videoType,
  watched,
  onClick,
}: Video & { onClick: () => void }) {
  const viewsText = formatViews(views);
  return (
    <button
      onClick={onClick}
      className="group cursor-pointer rounded-xl bg-white text-left shadow-sm ring-1 ring-stone-200 transition-all duration-200 hover:shadow-md hover:ring-amber-300"
    >
      {/* thumbnail */}
      <div
        className={`relative aspect-video rounded-t-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
      >
        <PlayIcon className="h-10 w-10 text-white/70 transition-transform duration-200 group-hover:scale-110" />
        {videoType === "overview" && (
          <span className="absolute top-2 left-2 rounded bg-stone-900/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            Overview
          </span>
        )}
        {videoType === "story" && (
          <span className="absolute top-2 left-2 rounded bg-stone-900/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            Story
          </span>
        )}
        {videoType === "creator" && (
          <span className="absolute top-2 left-2 rounded bg-amber-600/80 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur">
            Creator
          </span>
        )}
        {watched && (
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
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">{channel}</p>
        <p className="mt-1 text-xs font-bold text-amber-700">{viewsText} views</p>
      </div>
    </button>
  );
}

function VideoModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const viewsText = formatViews(video.views);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* YouTube embed */}
        <div className="relative aspect-video bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white/80 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        {/* info bar */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{video.title}</h2>
            <p className="text-sm text-stone-400">{video.channel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-amber-400">{viewsText} views</p>
            <p className="text-xs text-stone-500">and counting</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

function ShareSection() {
  const [copied, setCopied] = useState(false);
  // Resolved in the browser at click time; safe fallback for SSR/first paint.
  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "https://vidview-nxqq.onrender.com";
  const shareText = "Watching the Bible come alive on VidView 📖✨";

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(siteUrl);
    } catch {
      // Older/insecure-context fallback
      const textarea = document.createElement("textarea");
      textarea.value = siteUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(siteUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=520");
  }

  function handleShareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      siteUrl
    )}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=520");
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pt-4 pb-16 sm:pb-20">
      <div className="rounded-2xl border border-stone-200 bg-white px-6 py-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-stone-900">Share VidView</h2>
        <p className="mt-1 text-sm text-stone-500">
          Know someone who'd love to watch the Bible come alive? Spread the Word.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 active:scale-[0.98] ${
              copied
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-stone-300 bg-white text-stone-700 hover:border-amber-300 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleShareX}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98]"
          >
            <XIcon className="h-4 w-4" />
            Share on X
          </button>
          <button
            onClick={handleShareFacebook}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98]"
          >
            <FacebookIcon className="h-4 w-4" />
            Share on Facebook
          </button>
        </div>
      </div>
    </section>
  );
}

function BookShareSection({ videos }: { videos: Video[] }) {
  const books = Array.from(new Set(videos.map((video) => video.book).filter(Boolean)));
  if (books.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-6 py-5 text-center">
        <h2 className="text-lg font-bold text-stone-900">Share a book</h2>
        <p className="mt-1 text-sm text-stone-500">Share a book overview with a unique preview card.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {books.map((book) => (
            <a key={book} href={`/?book=${encodeURIComponent(book)}`} className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100">
              {book}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { uploaded, sort: initialSort, welcome, watch: watchParam } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const [sortMode, setSortMode] = useState<"order" | "views">(initialSort);
  // Seed state from the SSR loader so the first HTML contains real cards rather
  // than skeletons. The effect below refreshes counts on the client as before.
  const [videos, setVideos] = useState<Video[]>(loaderData.videos ?? []);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showUploadedBanner, setShowUploadedBanner] = useState(uploaded);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(welcome);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos?sort=${sortMode}`);
      if (!response.ok) throw new Error(`Video request failed (${response.status})`);
      const data = (await response.json()) as { videos: Video[] };
      setVideos(data.videos);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  }, [sortMode]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Auto-open video from watch param
  useEffect(() => {
    if (watchParam && videos.length > 0) {
      const video = videos.find((v) => v.youtubeId === watchParam);
      if (video) {
        setSelectedVideo(video);
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("watch");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [watchParam, videos]);

  function handleSortChange(newSort: "order" | "views") {
    setSortMode(newSort);
    const url = new URL(window.location.href);
    url.searchParams.set("sort", newSort);
    if (uploaded) url.searchParams.set("uploaded", "true");
    else url.searchParams.delete("uploaded");
    window.history.replaceState({}, "", url.toString());
  }

  async function handleVideoClick(video: Video) {
    setSelectedVideo(video);
    try {
      await fetch("/api/videos/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId: video.youtubeId }),
      });
      // Re-fetch to get updated view counts and re-sort
      await fetchVideos();
    } catch (err) {
      console.error("Failed to record view:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setDuplicate(false);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = (await response.json()) as {
        success: boolean;
        reason?: string;
      };
      if (result.success) {
        setSubmitted(true);
      } else if (result.reason === "duplicate") {
        setDuplicate(true);
      }
    } catch (err) {
      console.error("Failed to subscribe:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToWaitlist() {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800 antialiased">
      {/* ====== HERO ====== */}
      <header className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-stone-50 to-stone-50">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #b45309 1px, transparent 1px), radial-gradient(circle at 80% 20%, #b45309 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-32">
          <div className="mb-4 flex items-center justify-center gap-3">
            <CrossIcon className="h-8 w-8 text-amber-600" />
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              VidView
            </h1>
          </div>

          <p className="text-lg font-medium tracking-wide text-amber-700 sm:text-xl">
            Views of the Word
          </p>

          <p className="mx-auto mt-4 max-w-lg text-base text-stone-500 sm:text-lg">
            A video platform where the most-watched Bible stories rise to the
            top.
          </p>

          <button
            onClick={scrollToWaitlist}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98]"
          >
            Get Early Access
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <a
            href="/upload"
            className="mt-4 ml-0 sm:ml-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-6 py-3 text-sm font-semibold text-amber-700 shadow-sm transition-all duration-200 hover:bg-amber-50 hover:shadow-md active:scale-[0.98]"
          >
            <svg
              className="h-4 w-4"
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
            Upload Your Video
          </a>
        </div>
      </header>

      {/* ====== WELCOME BANNER ====== */}
      {showWelcomeBanner && (
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            <span>🙏 Welcome to VidView! Sign in to track your watch history.</span>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="ml-4 shrink-0 text-amber-600 hover:text-amber-800"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====== UPLOAD SUCCESS BANNER ====== */}
      {showUploadedBanner && (
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <span>🎉 Your video has been uploaded! It will appear at the bottom of the grid below.</span>
            <button
              onClick={() => setShowUploadedBanner(false)}
              className="ml-4 shrink-0 text-emerald-600 hover:text-emerald-800"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====== OT VIDEO GRID ====== */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Browse Videos
          </span>
          <h2 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
            The Old Testament &amp; Creator Uploads
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Bible story videos and animated overviews — in biblical order, with creator submissions below.
          </p>
        </div>

        {/* ====== SORT TOGGLE ====== */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5 shadow-sm">
            <button
              onClick={() => handleSortChange("order")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                sortMode === "order"
                  ? "bg-white text-stone-800 shadow-sm ring-1 ring-stone-200"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              In Order
            </button>
            <button
              onClick={() => handleSortChange("views")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                sortMode === "views"
                  ? "bg-white text-stone-800 shadow-sm ring-1 ring-stone-200"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              🔥 Trending
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-stone-200"
              >
                <div className="aspect-video rounded-t-xl bg-stone-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-stone-200" />
                  <div className="h-3 w-1/2 rounded bg-stone-100" />
                  <div className="h-3 w-1/3 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Link
                key={video.youtubeId}
                to="/video/$videoId"
                params={{ videoId: String(video.id ?? video.bookOrder) }}
                className="block"
              >
                <VideoCard
                  {...video}
                  onClick={() => handleVideoClick(video)}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ====== SHARE A BOOK ====== */}
      <BookShareSection videos={videos} />

      {/* ====== SHARE VIDVIEW ====== */}
      <ShareSection />

      {/* ====== HOW IT WORKS ====== */}
      <section className="border-y border-stone-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-stone-900 sm:text-3xl">
            How VidView Works
          </h2>
          <p className="mt-2 text-center text-sm text-stone-500">
            Simple, transparent, and driven by the community.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-stone-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== WAITLIST ====== */}
      <section id="waitlist" className="mx-auto max-w-lg px-6 py-16 sm:py-20">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-8 shadow-sm sm:p-10">
          <h2 className="text-center text-2xl font-bold text-stone-900">
            Be First on VidView
          </h2>
          <p className="mt-2 text-center text-sm text-stone-500">
            Join the early-access waitlist and be the first to experience views
            of the Word.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
              🎉 You're on the list! We'll be in touch when VidView launches.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <button
                type="submit"
                disabled={submitting}
                className="shrink-0 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Joining..." : "Join the Waitlist"}
              </button>
            </form>
          )}

          {duplicate && (
            <p className="mt-3 text-center text-sm text-amber-700">
              You're already on the list! We'll be in touch.
            </p>
          )}

          <p className="mt-4 text-center text-xs text-stone-400">
            No spam, ever. We'll only email you when VidView launches.
          </p>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-stone-200 bg-white py-8 text-center">
        <p className="text-sm text-stone-400">
          &copy; 2026 VidView &mdash; Bringing Bible stories to life.
        </p>
      </footer>

      {/* ====== VIDEO MODAL ====== */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

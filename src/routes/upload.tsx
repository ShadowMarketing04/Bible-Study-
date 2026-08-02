import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/upload")({
  component: Upload,
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

function Upload() {
  const [youtubeId, setYoutubeId] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = youtubeId.trim()
    ? `https://www.youtube-nocookie.com/embed/${youtubeId.trim()}`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!youtubeId.trim()) {
      setError("Please enter a YouTube Video ID.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/videos/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeId: youtubeId.trim(),
          title: title.trim(),
          channel: channel.trim() || undefined,
          submittedBy: submittedBy.trim() || undefined,
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (result.success) {
        window.location.href = "/?uploaded=true";
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Submit failed:", err);
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
      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <div className="mb-10 text-center">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Creator Upload
          </span>
          <h1 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
            Share Your Bible Story
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Upload a YouTube video that shares the Word — animated retellings,
            narrated scripture, visual devotionals, and more.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
        >
          {/* YouTube Video ID */}
          <div className="mb-5">
            <label
              htmlFor="youtubeId"
              className="block text-sm font-semibold text-stone-700 mb-1.5"
            >
              YouTube Video ID{" "}
              <span className="text-amber-600">*</span>
            </label>
            <p className="mb-2 text-xs text-stone-400">
              Paste the video ID from your YouTube URL (e.g.{" "}
              <code className="rounded bg-stone-100 px-1 py-0.5 text-stone-500">
                dQw4w9WgXcQ
              </code>
              ).
            </p>
            <input
              id="youtubeId"
              type="text"
              required
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              placeholder="dQw4w9WgXcQ"
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-5 overflow-hidden rounded-lg bg-black">
              <div className="relative aspect-video">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={previewUrl}
                  title="Video preview"
                  allow="encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="mb-5">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-stone-700 mb-1.5"
            >
              Video Title{" "}
              <span className="text-amber-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Story of David and Goliath"
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Channel Name */}
          <div className="mb-5">
            <label
              htmlFor="channel"
              className="block text-sm font-semibold text-stone-700 mb-1.5"
            >
              Your Channel Name
            </label>
            <p className="mb-2 text-xs text-stone-400">
              Defaults to &ldquo;Creator&rdquo; if left blank.
            </p>
            <input
              id="channel"
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="My Bible Channel"
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Your Name */}
          <div className="mb-6">
            <label
              htmlFor="submittedBy"
              className="block text-sm font-semibold text-stone-700 mb-1.5"
            >
              Your Name
            </label>
            <p className="mb-2 text-xs text-stone-400">
              Optional — your name as the submitter.
            </p>
            <input
              id="submittedBy"
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Upload Your Video"}
          </button>

          <p className="mt-4 text-center text-xs text-stone-400">
            By uploading, you agree that your video is Bible-focused content
            appropriate for the VidView community.
          </p>
        </form>
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

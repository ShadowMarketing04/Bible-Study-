import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/upload-image")({
  component: UploadImage,
});

/* ---------- page ---------- */

function UploadImage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please choose an image first.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        url?: string;
      };

      if (result.success) {
        setMessage(
          `og:image updated. It is now live at ${result.url ?? "/og-image.png"} and used as the share preview on Facebook, X (Twitter), and other platforms.`,
        );
        setFile(null);
        // Clear the file input so the same file can be picked again.
        const input = document.getElementById("image") as HTMLInputElement | null;
        if (input) input.value = "";
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-800 antialiased">
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Site Settings
          </span>
          <h1 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
            Upload Share Image
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Set the image shown when a VidView link is shared. Saved as{" "}
            <code className="rounded bg-stone-100 px-1 py-0.5 text-stone-500">
              og-image.png
            </code>{" "}
            — the share URL never changes.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-5">
            <label
              htmlFor="image"
              className="block text-sm font-semibold text-stone-700 mb-1.5"
            >
              Image File <span className="text-amber-600">*</span>
            </label>
            <p className="mb-2 text-xs text-stone-400">
              PNG, JPG, WEBP, or GIF — 10 MB max. A 1200&times;630 landscape
              image looks best.
            </p>
            <input
              id="image"
              name="image"
              type="file"
              required
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm transition-colors file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-amber-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
              <div className="mt-3 overflow-hidden rounded-lg border border-emerald-200">
                <img
                  src="/og-image.png"
                  alt="Current share image"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Image"}
          </button>

          <p className="mt-4 text-center text-xs text-stone-400">
            <a href="/" className="hover:text-stone-600 transition-colors">
              &larr; Back to Videos
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}

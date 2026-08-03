import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

interface Video {
  id: number;
  title: string;
  description: string;
  youtube_id: string;
  book: string;
  video_type: string;
  channel?: string;
}

export const Route = createFileRoute("/video/$videoId")({
  loader: async ({ params }) => {
    try {
      const base = typeof window === "undefined" ? "http://0.0.0.0:3000" : "";
      const response = await fetch(`${base}/api/video/${params.videoId}`);
      if (!response.ok) return { video: null };
      const data = (await response.json()) as { video?: Video };
      return { video: data.video ?? null };
    } catch {
      return { video: null };
    }
  },
  head: ({ loaderData }) => {
    const video = loaderData?.video;
    if (!video) return { meta: [{ title: "Video not found — VidView" }] };
    const description = video.description.slice(0, 200);
    const url = `https://vidview-nxqq.onrender.com/video/${video.id}`;
    const image = `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`;
    return {
      meta: [
        { title: `${video.title} — VidView` },
        { property: "og:title", content: `${video.title} — VidView` },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:url", content: url },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${video.title} — VidView` },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
    };
  },
  component: VideoPage,
});

function LinkIcon() { return <span aria-hidden="true">🔗</span>; }
function XIcon() { return <span aria-hidden="true" className="font-bold">𝕏</span>; }
function FacebookIcon() { return <span aria-hidden="true" className="font-bold">f</span>; }

function ShareSection({ video }: { video: Video }) {
  const [copied, setCopied] = useState(false);
  const siteUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://vidview-nxqq.onrender.com/video/${video.id}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(siteUrl); }
    catch { /* clipboard is unavailable in some browsers */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(video.title)}&url=${encodeURIComponent(siteUrl)}`, "_blank", "noopener,noreferrer,width=600,height=520");
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`, "_blank", "noopener,noreferrer,width=600,height=520");
  const button = "inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-stone-50";
  return <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
    <h2 className="text-lg font-bold text-stone-900">Share this video</h2>
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      <button onClick={copy} className={`${button} ${copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : ""}`}><LinkIcon />{copied ? "Copied!" : "Copy Link"}</button>
      <button onClick={shareX} className={button}><XIcon />Share on X</button>
      <button onClick={shareFacebook} className={button}><FacebookIcon />Share on Facebook</button>
    </div>
  </section>;
}

function VideoPage() {
  const { video } = Route.useLoaderData();
  if (!video) return <main className="mx-auto max-w-3xl px-6 py-16"><Link to="/" className="text-sm text-amber-700 hover:underline">← Back to all videos</Link><h1 className="mt-12 text-2xl font-bold">Video not found</h1></main>;
  return <main className="min-h-dvh bg-stone-50 px-6 py-8 text-stone-800 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <Link to="/" className="text-sm font-medium text-amber-700 hover:text-amber-800 hover:underline">← Back to all videos</Link>
      <article className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <div className="relative aspect-video bg-black"><iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0`} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{video.book} · {video.video_type}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">{video.title}</h1>
          {video.channel && <p className="mt-1 text-sm text-stone-500">{video.channel}</p>}
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-stone-600">{video.description}</p>
          <ShareSection video={video} />
        </div>
      </article>
    </div>
  </main>;
}

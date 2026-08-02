// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 — static files first, SSR for the
// rest. Run `bun run build` before starting. Restart it with `bun run publish`.
//
// Starting a new instance supersedes the old one: it frees the port no matter
// which user owns the current server (provisioning starts it as `engine`; a team
// member's `bun run publish` runs as their own user), so publish never collides
// with an already-running server. Every sandbox user has passwordless sudo, so
// the takeover works across user boundaries.
import handler from "./dist/server/server.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "./src/auth";
import { sql } from "./src/db";

// Pinned, NOT read from the environment. The published preview URL
// (<label>.<PUBLIC_SITE_DOMAIN>) is reverse-proxied to 0.0.0.0:3000 inside the
// sandbox, so the default site MUST bind there. Bun auto-loads .env files, so
// honouring process.env.PORT/HOST would let a stray env var or a .env in the site
// dir silently move the site off :3000 (or onto loopback) and break the public URL.
const PORT = 3000; // hardcoded: sandbox reverse proxy targets :3000
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;

// Free PORT regardless of which user owns the current listener. lsof runs under
// sudo so it can see (and the kill can signal) a process owned by another user;
// the loop waits for the socket to actually release before we bind.
const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

/* ---------- email ---------- */
// Resend delivers the welcome email after a successful waitlist signup. The
// caller catches failures so an email outage never fails the signup itself.
async function sendWelcomeEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[mail] No RESEND_API_KEY configured — email not sent to:", to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "VidView <welcome@vidview-nxqq.onrender.com>",
      to: [to],
      subject: "Welcome to VidView — you're on the list!",
      html: `<p>Thank you for joining the VidView waitlist!</p>
<p>You're now on the early-access list and will be among the first to know when new features and content launch.</p>
<p>In the meantime, explore the Bible from Genesis to Revelation at <a href="https://vidview-nxqq.onrender.com">vidview-nxqq.onrender.com</a>.</p>
<p>— The VidView Team</p>`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  console.log("[mail] Welcome email sent to:", to);
}

// API handlers (bypass TanStack Start server functions for reliability on Vercel)
async function handleApiAuth(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);
  
  if (pathname === "/api/auth/signup" && req.method === "POST") {
    try {
      const body = await req.json();
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";
      const name = (body.name || "").trim() || null;

      if (!email || !password) {
        return Response.json({ success: false, error: "Email and password are required." }, { status: 400 });
      }
      if (password.length < 6) {
        return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
      }

      const existing = await sql()`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return Response.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const result = await sql()`
        INSERT INTO users (email, password_hash, name)
        VALUES (${email}, ${passwordHash}, ${name})
        RETURNING id, email, name
      `;
      const user = result[0];
      const token = await signToken({ id: user.id, email: user.email });
      return Response.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name as string | null } });
    } catch (err) {
      console.error("[api] signup error:", err);
      return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = await req.json();
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";

      if (!email || !password) {
        return Response.json({ success: false, error: "Email and password are required." }, { status: 400 });
      }

      const rows = await sql()`SELECT id, email, password_hash, name FROM users WHERE email = ${email}`;
      if (rows.length === 0) {
        return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
      }

      const user = rows[0];
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
      }

      const token = await signToken({ id: user.id, email: user.email });
      return Response.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name as string | null } });
    } catch (err) {
      console.error("[api] login error:", err);
      return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  if (pathname === "/api/auth/me" && req.method === "GET") {
    try {
      const user = await getUserFromRequest(req);
      if (!user) return Response.json({ user: null });
      const rows = await sql()`SELECT name FROM users WHERE id = ${user.id}`;
      return Response.json({
        user: {
          id: user.id,
          email: user.email,
          name: (rows[0]?.name as string | null) || null,
        },
      });
    } catch (err) {
      console.error("[api] me error:", err);
      return Response.json({ user: null });
    }
  }

  return null;
}

// Resolve the authenticated user (if any) from the vidview_token JWT cookie.
async function getUserFromRequest(req: Request): Promise<{ id: number; email: string } | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith("vidview_token="))?.slice("vidview_token=".length);
  if (!token) return null;
  return await verifyToken(token);
}

async function handleApiVideos(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  if (url.pathname !== "/api/videos" || req.method !== "GET") return null;

  try {
    const sort = url.searchParams.get("sort") === "views" ? "views" : "order";
    const rows = sort === "views"
      ? await sql()`
          SELECT title, channel, youtube_id, gradient, views, video_type, book_order
          FROM videos ORDER BY views DESC, book_order ASC
        `
      : await sql()`
          SELECT title, channel, youtube_id, gradient, views, video_type, book_order
          FROM videos ORDER BY book_order ASC
        `;

    const userId = (await getUserFromRequest(req))?.id ?? null;

    const watchedIds = new Set<string>();
    if (userId !== null) {
      const history = await sql()`
        SELECT youtube_id FROM watch_history WHERE user_id = ${userId}
      `;
      for (const row of history) watchedIds.add(row.youtube_id as string);
    }

    return Response.json({
      videos: rows.map((row) => ({
        title: row.title,
        channel: row.channel,
        views: row.views as number,
        gradient: row.gradient,
        youtubeId: row.youtube_id,
        videoType: (row.video_type as string) || "story",
        bookOrder: row.book_order as number,
        watched: watchedIds.has(row.youtube_id as string),
      })),
    });
  } catch (err) {
    console.error("[api] videos error:", err);
    return Response.json({ videos: [], error: "Unable to load videos." }, { status: 500 });
  }
}

// POST /api/videos/view — increment the public view counter for a video, and
// (when the requester is authenticated) upsert it into their watch history.
// POST /api/videos/submit — creator uploads: validate, de-dupe, insert as a
// 'creator' video with a random gradient.
async function handleApiVideoActions(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);

  if (pathname === "/api/videos/view" && req.method === "POST") {
    try {
      const body = await req.json();
      const youtubeId = (body.youtubeId || "").trim();
      if (!youtubeId) {
        return Response.json({ success: false, error: "YouTube Video ID is required." }, { status: 400 });
      }

      await sql()`
        UPDATE videos SET views = views + 1
        WHERE youtube_id = ${youtubeId}
      `;

      // Track in watch history if the user is logged in
      const user = await getUserFromRequest(req);
      if (user) {
        await sql()`
          INSERT INTO watch_history (user_id, youtube_id, watched_at)
          VALUES (${user.id}, ${youtubeId}, NOW())
          ON CONFLICT (user_id, youtube_id)
          DO UPDATE SET watched_at = NOW()
        `;
      }

      return Response.json({ success: true });
    } catch (err) {
      console.error("[api] videos/view error:", err);
      return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  if (pathname === "/api/videos/submit" && req.method === "POST") {
    try {
      const body = await req.json();
      const youtubeId = (body.youtubeId || "").trim();
      const title = (body.title || "").trim();
      const channel = (body.channel || "").trim() || "Creator";
      const submittedBy = (body.submittedBy || "").trim() || null;

      if (!youtubeId) {
        return Response.json({ success: false, error: "YouTube Video ID is required." }, { status: 400 });
      }
      if (!title) {
        return Response.json({ success: false, error: "Title is required." }, { status: 400 });
      }

      // Reject duplicate YouTube IDs
      const existing = await sql()`
        SELECT id FROM videos WHERE youtube_id = ${youtubeId}
      `;
      if (existing.length > 0) {
        return Response.json(
          { success: false, error: "A video with this YouTube ID already exists on VidView." },
          { status: 409 },
        );
      }

      // Random gradient from the seeded set
      const gradients = [
        "from-emerald-600 via-green-500 to-lime-400",
        "from-sky-600 via-cyan-500 to-teal-400",
        "from-indigo-700 via-purple-500 to-pink-400",
        "from-red-800 via-red-600 to-amber-500",
        "from-amber-700 via-orange-500 to-yellow-500",
        "from-rose-700 via-red-500 to-orange-400",
        "from-violet-700 via-purple-600 to-fuchsia-500",
        "from-teal-700 via-cyan-600 to-blue-500",
      ];
      const gradient = gradients[Math.floor(Math.random() * gradients.length)];

      const result = await sql()`
        INSERT INTO videos (title, channel, youtube_id, gradient, views, video_type, book_order, submitted_by)
        VALUES (${title}, ${channel}, ${youtubeId}, ${gradient}, 0, 'creator', 999999, ${submittedBy})
        ON CONFLICT (youtube_id, title) DO NOTHING
        RETURNING id, title, channel, youtube_id, views, video_type, book_order
      `;

      if (result.length === 0) {
        return Response.json(
          { success: false, error: "This video could not be added (possible duplicate title)." },
          { status: 409 },
        );
      }

      return Response.json({ success: true, video: result[0] });
    } catch (err) {
      console.error("[api] videos/submit error:", err);
      return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  return null;
}

// GET /api/profile — return the authenticated user's profile and watch history.
async function handleApiProfile(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);
  if (pathname !== "/api/profile" || req.method !== "GET") return null;

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const userRows = await sql()`
      SELECT id, email, name, created_at FROM users WHERE id = ${user.id}
    `;
    if (userRows.length === 0) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const history = await sql()`
      SELECT wh.youtube_id, wh.watched_at, v.title, v.channel, v.gradient
      FROM watch_history wh
      JOIN videos v ON v.youtube_id = wh.youtube_id
      WHERE wh.user_id = ${user.id}
      ORDER BY wh.watched_at DESC
    `;

    const profile = userRows[0];
    return Response.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name as string | null,
        created_at: profile.created_at,
      },
      history: history.map((item) => ({
        youtube_id: item.youtube_id,
        watched_at: String(item.watched_at),
        title: item.title,
        channel: item.channel,
        gradient: item.gradient,
      })),
    });
  } catch (err) {
    console.error("[api] profile error:", err);
    return Response.json({ error: "Unable to load profile." }, { status: 500 });
  }
}

// GET /api/subscription — return the authenticated user's current subscription.
async function handleApiSubscription(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);
  if (pathname !== "/api/subscription" || req.method !== "GET") return null;

  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ subscription: null });
    const rows = await sql()`
      SELECT tier, status, current_period_end
      FROM subscriptions
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return Response.json({ subscription: null });
    return Response.json({
      subscription: {
        tier: row.tier as string,
        status: row.status as string,
        active: row.status === "active",
        current_period_end: row.current_period_end ? String(row.current_period_end) : null,
      },
    });
  } catch (err) {
    console.error("[api] subscription error:", err);
    return Response.json({ subscription: null, error: "Unable to load subscription." }, { status: 500 });
  }
}

// POST /api/stripe/webhook — placeholder for Stripe event processing.
async function handleStripeWebhook(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);
  if (pathname !== "/api/stripe/webhook" || req.method !== "POST") return null;
  try {
    const body = await req.text();
    console.log("[stripe webhook] event:", body);
    return Response.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] error:", err);
    return Response.json({ received: false }, { status: 400 });
  }
}

// POST /api/waitlist — join the early-access waitlist (de-dupes by email).
async function handleApiWaitlist(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);
  if (pathname !== "/api/waitlist" || req.method !== "POST") return null;

  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    if (!email) {
      return Response.json({ success: false, reason: "invalid", error: "Email is required." }, { status: 400 });
    }

    const existing = await sql()`SELECT id FROM waitlist WHERE email = ${email}`;
    if (existing.length > 0) {
      return Response.json({ success: false, reason: "duplicate" });
    }

    await sql()`INSERT INTO waitlist (email) VALUES (${email})`;
    // Send the welcome email after a successful NEW signup. A send failure
    // must not fail the signup, so it's best-effort and never thrown here.
    await sendWelcomeEmail(email).catch((err) =>
      console.error("[api] waitlist welcome email failed:", err)
    );
    return Response.json({ success: true, reason: "ok" });
  } catch (err) {
    console.error("[api] waitlist error:", err);
    return Response.json({ success: false, reason: "error", error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// Take over the port, re-freeing and retrying if another publish grabbed it in the
// gap between freeing and binding (last publish wins). Bun.serve throws EADDRINUSE
// synchronously, so without this a raced publish would die while the shell already
// reported success.
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname } = new URL(req.url);
        
        // Handle API routes directly (bypass SSR for reliability on Vercel)
        const apiResult = await handleApiAuth(req);
        if (apiResult) return apiResult;
        const videosResult = await handleApiVideos(req);
        if (videosResult) return videosResult;
        const videoActionResult = await handleApiVideoActions(req);
        if (videoActionResult) return videoActionResult;
        const profileResult = await handleApiProfile(req);
        if (profileResult) return profileResult;
        const subscriptionResult = await handleApiSubscription(req);
        if (subscriptionResult) return subscriptionResult;
        const stripeWebhookResult = await handleStripeWebhook(req);
        if (stripeWebhookResult) return stripeWebhookResult;
        const waitlistResult = await handleApiWaitlist(req);
        if (waitlistResult) return waitlistResult;
        
        // Static files
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) return new Response(file);
        }
        
        // SSR handler
        return (
          handler as { fetch: (r: Request) => Response | Promise<Response> }
        ).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);

// Vercel Build Output API function entry.
//
// The Build Output Node launcher invokes the default export as a classic Node
// `(req, res)` handler — NOT a web handler. TanStack Start emits a portable web
// fetch handler (dist/server/server.js), so we adapt: Node IncomingMessage → web
// Request, run the fetch handler, stream the web Response back onto ServerResponse.
// Node 22 has global Request/Response/Headers/ReadableStream.
//
// Bundled (with its deps + the SSR handler's dynamic ./assets chunks) into
// .vercel/output/functions/render.func/index.mjs by build-vercel.sh.
import type { IncomingMessage, ServerResponse } from "node:http";

import handler from "./dist/server/server.js";

// Runtime imports for API handlers (bundled inline by bun build)
// We import from source which will be resolved at bundle time
import { hashPassword, verifyPassword, signToken } from "./src/auth";
import { neon } from "@neondatabase/serverless";

const sql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
};

async function handleApiAuth(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);

  // Diagnostic: health check
  if (pathname === "/api/health") {
    return Response.json({
      hasDb: !!process.env.DATABASE_URL,
      hasJwt: !!process.env.JWT_SECRET,
    });
  }

  if (pathname === "/api/auth/signup" && request.method === "POST") {
    try {
      const body = await request.json();
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
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[api] signup error:", msg);
      return Response.json({ success: false, error: "Server error: " + msg }, { status: 500 });
    }
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await request.json();
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
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[api] login error:", msg);
      return Response.json({ success: false, error: "Server error: " + msg }, { status: 500 });
    }
  }

  return null;
}

const fetchHandler = handler as {
  fetch: (request: Request) => Response | Promise<Response>;
};

const toWebRequest = (req: IncomingMessage): Request => {
  const host = req.headers.host ?? "localhost";
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const url = `${proto}://${host}${req.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else if (value != null) headers.set(key, value);
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url, {
    method,
    headers,
    ...(hasBody
      ? { body: req as unknown as ReadableStream, duplex: "half" }
      : {}),
  } as RequestInit);
};

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const webReq = toWebRequest(req);
    
    // Handle API routes directly
    const apiResult = await handleApiAuth(webReq);
    if (apiResult) {
      res.statusCode = apiResult.status;
      apiResult.headers.forEach((value, key) => res.setHeader(key, value));
      const body = await apiResult.text();
      res.end(body);
      return;
    }
    
    const webRes = await fetchHandler.fetch(webReq);
    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => res.setHeader(key, value));
    if (webRes.body) {
      const reader = webRes.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    // Log the detail server-side (captured by the host's function logs); never
    // return a stack trace to the public visitor of the site.
    console.error("[team-site] SSR request failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Internal Server Error");
  }
}

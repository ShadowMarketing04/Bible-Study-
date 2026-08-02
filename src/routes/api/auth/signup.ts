import { sql } from "~/db";
import { hashPassword, signToken } from "~/auth";

export async function POST({ request }: { request: Request }) {
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

    // Check for duplicate
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
    return Response.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name as string | null },
    });
  } catch (err) {
    console.error("[api] signup error:", err);
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

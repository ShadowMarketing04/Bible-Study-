import { sql } from "~/db";
import { verifyPassword, signToken } from "~/auth";

export async function POST({ request }: { request: Request }) {
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
    return Response.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name as string | null },
    });
  } catch (err) {
    console.error("[api] login error:", err);
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

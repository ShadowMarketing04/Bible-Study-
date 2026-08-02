import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;
const JWT_EXPIRY = "7d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

/** Hash a plaintext password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare a plaintext password against a bcrypt hash */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Sign a JWT with the user's id and email */
export async function signToken(payload: {
  id: number;
  email: string;
}): Promise<string> {
  return new SignJWT({ sub: String(payload.id), email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

/** Verify and decode a JWT, returning the payload or null */
export async function verifyToken(
  token: string,
): Promise<{ id: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    if (!id || !payload.email) return null;
    return { id, email: String(payload.email) };
  } catch {
    return null;
  }
}

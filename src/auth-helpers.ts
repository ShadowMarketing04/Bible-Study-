import { getRequest } from "@tanstack/start-server-core";
import { verifyToken } from "./auth";

/**
 * Get the current authenticated user from the JWT cookie.
 * Call this inside a `createServerFn().handler()`.
 * Returns user or null.
 */
export async function getCurrentUser(): Promise<{
  id: number;
  email: string;
} | null> {
  try {
    const request = getRequest();
    if (!request) return null;
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;

    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((pair) => {
      const [key, ...rest] = pair.trim().split("=");
      if (key) cookies[key] = rest.join("=");
    });

    const token = cookies["vidview_token"];
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

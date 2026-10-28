import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getUserById, type UserRow } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ai-judge-super-secret-key-change-me-in-production"
);

export interface JWTPayload {
  userId: string;
  role: "admin" | "user";
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<
  (JWTPayload & { user?: UserRow }) | null
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = getUserById(payload.userId);
  if (!user) return null;
  return { ...payload, user };
}

export async function requireAuth(
  role?: "admin" | "user"
): Promise<JWTPayload & { user: UserRow }> {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.is_banned) {
    throw new Error(`Account Banned: ${session.user.ban_reason || "Suspended for platform integrity violation"}`);
  }
  if (role && session.role !== role) {
    throw new Error("Forbidden");
  }
  return session as JWTPayload & { user: UserRow };
}

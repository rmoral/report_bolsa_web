import jwt from "jsonwebtoken";

export interface AuthUser {
  sub: string;
  role: "user" | "admin";
  plan: "lite" | "pro";
}

export function verifyAuth(token?: string): AuthUser | null {
  if (!token) return null;
  try {
    const cleaned = token.replace(/^Bearer\s+/i, "");
    return jwt.verify(cleaned, process.env.JWT_SECRET as string) as any;
  } catch {
    return null;
  }
}



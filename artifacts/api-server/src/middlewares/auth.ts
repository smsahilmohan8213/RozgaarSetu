import type { RequestHandler } from "express";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../lib/supabase";

const verifyToken = async (token: string) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!res.ok) return null;
  const body = await res.json();
  return body;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization!.split(" ")[1]
      : undefined;
    const token = tokenFromHeader || (req.cookies && req.cookies["sb-access-token"]);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    (req as any).user = user;
    return next();
  } catch (err) {
    return next(err as any);
  }
};

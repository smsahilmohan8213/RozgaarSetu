import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await (supabase as any).auth.signUp({ email, password });

    if (result.error) {
      return res.status(400).json({ error: result.error.message || result.error });
    }

    const data = result.data ?? result;

    // If a session was returned, persist tokens in HttpOnly cookies
    const session = data.session;
    if (session) {
      res.cookie("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.cookie("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return res.json({ user: data.user ?? null, message: "Signup initiated" });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await (supabase as any).auth.signInWithPassword({ email, password });
    if (result.error) {
      return res.status(400).json({ error: result.error.message || result.error });
    }

    const data = result.data ?? result;
    const session = data.session;
    if (session) {
      res.cookie("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.cookie("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    return res.json({ user: data.user ?? null, message: "Logged in" });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res) => {
  // Clear cookies on logout. Token revocation can be added if desired.
  res.clearCookie("sb-access-token");
  res.clearCookie("sb-refresh-token");
  return res.json({ message: "Logged out" });
});

router.get("/session", async (req, res) => {
  const token = req.cookies && req.cookies["sb-access-token"] || req.headers.authorization?.split(" ")[1];
  if (!token) return res.json({ user: null });

  try {
    const resp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      },
    });

    if (!resp.ok) return res.json({ user: null });
    const user = await resp.json();
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Example protected route
router.get("/protected", requireAuth, (req, res) => {
  return res.json({ ok: true, user: (req as any).user });
});

export default router;

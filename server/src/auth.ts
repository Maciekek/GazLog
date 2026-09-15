import crypto from "node:crypto";
import type { Request, Response, NextFunction, Router } from "express";
import express from "express";
import { createSession, deleteSession, getUserBySession, upsertUser, type User } from "./db.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const SECURE = BASE_URL.startsWith("https://");

const SESSION_COOKIE = "gazlog_session";
const STATE_COOKIE = "gazlog_oauth_state";
const RETURN_COOKIE = "gazlog_oauth_return";
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

export const authConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);
if (!authConfigured) {
  console.warn("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set – login disabled");
}

/** Origin the browser used to start login, e.g. http://localhost:5173 when behind the Vite dev proxy. */
function requestOrigin(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0] ?? req.headers.host ?? "";
  return `${proto}://${host}`;
}

/** Only allow returning to BASE_URL or a localhost dev origin; otherwise fall back to BASE_URL. */
function safeReturnUrl(candidate: string | undefined): string {
  if (!candidate) return BASE_URL;
  try {
    const u = new URL(candidate);
    const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (isLocal || u.origin === BASE_URL) return u.origin;
  } catch {}
  return BASE_URL;
}

function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setCookie(res: Response, name: string, value: string, maxAgeSec: number) {
  res.append(
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${SECURE ? "; Secure" : ""}`
  );
}

function clearCookie(res: Response, name: string) {
  setCookie(res, name, "", 0);
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function loadUser(req: Request, _res: Response, next: NextFunction) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) req.user = getUserBySession(token);
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });
  next();
}

export const authRouter: Router = express.Router();

authRouter.get("/google", (_req, res) => {
  if (!authConfigured) return res.status(503).send("Google login not configured");
  const state = crypto.randomBytes(16).toString("hex");
  setCookie(res, STATE_COOKIE, state, 600);
  setCookie(res, RETURN_COOKIE, requestOrigin(_req), 600);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  res.redirect(url.toString());
});

authRouter.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    const cookies = parseCookies(req);
    const APP_URL = safeReturnUrl(cookies[RETURN_COOKIE]);
    clearCookie(res, STATE_COOKIE);
    clearCookie(res, RETURN_COOKIE);
    if (!code || !state || state !== cookies[STATE_COOKIE]) {
      return res.redirect(`${APP_URL}/?error=state`);
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("token exchange failed", await tokenRes.text());
      return res.redirect(`${APP_URL}/?error=token`);
    }
    const tokens = (await tokenRes.json()) as { access_token: string };

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!infoRes.ok) return res.redirect(`${APP_URL}/?error=userinfo`);
    const info = (await infoRes.json()) as {
      sub: string;
      email: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (!info.email || info.email_verified === false) return res.redirect(`${APP_URL}/?error=email`);
    if (ALLOWED_EMAILS.length && !ALLOWED_EMAILS.includes(info.email.toLowerCase())) {
      return res.redirect(`${APP_URL}/?error=forbidden`);
    }

    const user = upsertUser(info);
    const token = crypto.randomBytes(32).toString("hex");
    createSession(user.id, token);
    setCookie(res, SESSION_COOKIE, token, 30 * 24 * 3600);
    res.redirect(`${APP_URL}/`);
  } catch (e) {
    console.error(e);
    res.redirect(`${safeReturnUrl(parseCookies(req)[RETURN_COOKIE])}/?error=internal`);
  }
});

authRouter.post("/logout", (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) deleteSession(token);
  clearCookie(res, SESSION_COOKIE);
  res.status(204).end();
});

authRouter.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthorized", loginEnabled: authConfigured });
  const { id, email, name, picture } = req.user;
  res.json({ id, email, name, picture });
});

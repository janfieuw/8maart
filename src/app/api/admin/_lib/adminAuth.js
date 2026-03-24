import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE_NAME = "punctoo_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET ontbreekt.");
  }
  return secret;
}

function getAdminEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function getAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || "");
}

function getAdminPasswordHash() {
  return String(process.env.ADMIN_PASSWORD_HASH || "");
}

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function signPayload(payload) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");
}

function createSessionToken(sessionData) {
  const payload = JSON.stringify(sessionData);
  const encoded = base64urlEncode(payload);
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;

  const [encoded, signature] = token.split(".");
  const expected = signPayload(encoded);

  if (signature !== expected) return null;

  try {
    const raw = base64urlDecode(encoded);
    const session = JSON.parse(raw);

    if (!session?.email || session?.role !== "admin") {
      return null;
    }

    if (!session?.exp || Date.now() > session.exp) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function verifyAdminCredentials(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  const adminPasswordHash = getAdminPasswordHash();

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL ontbreekt.");
  }

  if (!adminPassword && !adminPasswordHash) {
    throw new Error("ADMIN_PASSWORD of ADMIN_PASSWORD_HASH ontbreekt.");
  }

  if (normalizedEmail !== adminEmail) {
    return false;
  }

  if (adminPasswordHash) {
    return bcrypt.compare(rawPassword, adminPasswordHash);
  }

  return rawPassword === adminPassword;
}

export async function createAndSetAdminSession() {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;

  const token = createSessionToken({
    role: "admin",
    email: getAdminEmail(),
    name: "Punctoo Admin",
    exp,
  });

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return token;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";
  return verifySessionToken(token);
}

export { ADMIN_SESSION_COOKIE_NAME };
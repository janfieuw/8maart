import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "punctoo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET ontbreekt.");
  }
  return secret;
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
  const secret = getAuthSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
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

    if (!session?.userId || !session?.companyId || !session?.email) {
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

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function createAndSetSession(user) {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;

  const token = createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    companyName: user.companyName || "",
    email: user.email,
    name: user.name || "",
    exp,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || "";
  return verifySessionToken(token);
}

export function slugifyCompanyName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function buildUniqueCompanySlug(prisma, name) {
  const base = slugifyCompanyName(name) || "bedrijf";
  let slug = base;
  let i = 1;

  while (true) {
    const existing = await prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

    i += 1;
    slug = `${base}-${i}`;
  }
}
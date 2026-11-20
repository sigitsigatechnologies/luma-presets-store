import crypto from "node:crypto";
import { config } from "./config/env.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || config.adminPass || "luma-admin-session-secret";
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = signPayload(payload);
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);

  if (actualBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(actualBuf, expectedBuf)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!data?.exp || data.exp < Date.now()) return null;
    if (data.user !== config.adminUser) return null;
    return data;
  } catch {
    return null;
  }
}

export function getBearerToken(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function isAuthenticated(req) {
  return !!verifyToken(getBearerToken(req));
}

export function createAdminSession() {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ user: config.adminUser, iat: now, exp: now + SESSION_TTL_MS })
  ).toString("base64url");

  return `${payload}.${signPayload(payload)}`;
}

export function removeAdminSession() {
  // Token bersifat stateless; logout cukup menghapus token di sisi client.
}

export function checkAdminCredentials(username, password) {
  return username === config.adminUser && password === config.adminPass;
}

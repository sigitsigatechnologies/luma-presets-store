import crypto from "node:crypto";
import { config } from "./config/env.js";

const adminSessions = globalThis.__admin_sessions || new Set();
globalThis.__admin_sessions = adminSessions;

export function getBearerToken(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function isAuthenticated(req) {
  const token = getBearerToken(req);
  if (!token) return false;
  return adminSessions.has(token);
}

export function createAdminSession() {
  const token = crypto.randomUUID();
  adminSessions.add(token);
  return token;
}

export function removeAdminSession(token) {
  if (token) adminSessions.delete(token);
}

export function checkAdminCredentials(username, password) {
  return username === config.adminUser && password === config.adminPass;
}

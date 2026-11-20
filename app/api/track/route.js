import { NextResponse } from "next/server";
import { query } from "@/lib/config/database.js";

export const dynamic = "force-dynamic";

let ensurePromise = null;

async function ensureTable() {
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    await query(`CREATE TABLE IF NOT EXISTS site_visits (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT,
      path TEXT DEFAULT '/',
      referrer TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      visit_date DATE DEFAULT (CURRENT_DATE)
    )`);
    await query(`CREATE INDEX IF NOT EXISTS idx_site_visits_created ON site_visits(created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_site_visits_visitor ON site_visits(visitor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visit_date)`);
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });
  return ensurePromise;
}

export async function POST(req) {
  try {
    await ensureTable();
    const body = await req.json().catch(() => ({}));
    const visitorId = body?.visitorId ? String(body.visitorId).slice(0, 100) : null;
    const path = body?.path ? String(body.path).slice(0, 300) : "/";
    const ref = (req.headers.get("referer") || "").slice(0, 300);
    const ua = (req.headers.get("user-agent") || "").slice(0, 300);

    await query(
      `INSERT INTO site_visits (visitor_id, path, referrer, user_agent) VALUES ($1, $2, $3, $4)`,
      [visitorId, path, ref, ua]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

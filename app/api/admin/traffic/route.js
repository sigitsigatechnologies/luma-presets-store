import { NextResponse } from "next/server";
import { query } from "@/lib/config/database.js";
import { isAuthenticated } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pastikan tabel ada (kompatibel dengan DB lama)
    await query(`CREATE TABLE IF NOT EXISTS site_visits (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT,
      path TEXT DEFAULT '/',
      referrer TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      visit_date DATE DEFAULT (CURRENT_DATE)
    )`);

    const [tot, uniq, today, todayUniq, week, weekUniq] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM site_visits`),
      query(`SELECT COUNT(DISTINCT visitor_id)::int AS c FROM site_visits WHERE visitor_id IS NOT NULL`),
      query(`SELECT COUNT(*)::int AS c FROM site_visits WHERE visit_date = CURRENT_DATE`),
      query(`SELECT COUNT(DISTINCT visitor_id)::int AS c FROM site_visits WHERE visit_date = CURRENT_DATE AND visitor_id IS NOT NULL`),
      query(`SELECT COUNT(*)::int AS c FROM site_visits WHERE created_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(DISTINCT visitor_id)::int AS c FROM site_visits WHERE created_at >= NOW() - INTERVAL '7 days' AND visitor_id IS NOT NULL`),
    ]);

    return NextResponse.json({
      totalViews: tot.rows[0]?.c || 0,
      uniqueVisitors: uniq.rows[0]?.c || 0,
      todayViews: today.rows[0]?.c || 0,
      todayUnique: todayUniq.rows[0]?.c || 0,
      weekViews: week.rows[0]?.c || 0,
      weekUnique: weekUniq.rows[0]?.c || 0,
    });
  } catch (err) {
    return NextResponse.json({
      totalViews: 0,
      uniqueVisitors: 0,
      todayViews: 0,
      todayUnique: 0,
      weekViews: 0,
      weekUnique: 0,
      error: err.message,
    });
  }
}

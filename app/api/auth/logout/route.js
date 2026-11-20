import { NextResponse } from "next/server";
import { getBearerToken, removeAdminSession } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const token = getBearerToken(req);
  if (token) removeAdminSession(token);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth.js";
import { config } from "@/lib/config/env.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (isAuthenticated(req)) {
    return NextResponse.json({ authenticated: true, username: config.adminUser });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

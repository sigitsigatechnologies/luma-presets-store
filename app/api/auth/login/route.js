import { NextResponse } from "next/server";
import { checkAdminCredentials, createAdminSession } from "@/lib/auth.js";
import { config } from "@/lib/config/env.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (checkAdminCredentials(username, password)) {
      const token = createAdminSession();
      return NextResponse.json({ token, username });
    }

    return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

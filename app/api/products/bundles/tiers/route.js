import { NextResponse } from "next/server";
import { BUNDLE_TIERS } from "@/lib/config/bundles.js";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(Object.values(BUNDLE_TIERS));
}

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_FEED =
  "https://raw.githubusercontent.com/RakheebShaik-web/NSE-bot/main/dashboard-data/latest.json";

export async function GET() {
  const source = process.env.DASHBOARD_DATA_URL || DEFAULT_FEED;
  try {
    const response = await fetch(source, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Feed returned ${response.status}`);
    }
    const payload = await response.json();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        schema_version: 1,
        generated_at: null,
        source,
        status: "unavailable",
        summary: { trades: 0 },
        equity: [],
        yearly: [],
        trades: [],
        signals: [],
        factors: [],
        error: error instanceof Error ? error.message : "Feed unavailable",
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

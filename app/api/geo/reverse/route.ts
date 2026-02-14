import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const WINDOW_MS = 60_000;
const LIMIT = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const limit = rateLimit(`geo:reverse:${ip}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "10");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "rekkomo-app/1.0",
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Geocode failed" }, { status: 500 });
  }

  const data = await res.json();
  const address = data.address ?? {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    "";
  const state = address.state || "";
  const country = address.country || "";
  const label = [city, state, country].filter(Boolean).join(", ");

  return NextResponse.json({ label: label || data.display_name || "" });
}

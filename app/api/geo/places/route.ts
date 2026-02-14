import { NextResponse } from "next/server";

const GOOGLE_API = "https://maps.googleapis.com/maps/api/place/autocomplete/json";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "city";

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google API key not configured" },
      { status: 500 }
    );
  }

  const placeType = type === "state" ? "(regions)" : "(cities)";
  const url = `${GOOGLE_API}?input=${encodeURIComponent(
    q
  )}&types=${encodeURIComponent(placeType)}&components=country:in&key=${apiKey}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const data = await res.json();
  const predictions = Array.isArray(data?.predictions) ? data.predictions : [];

  const items = predictions.map((prediction: any) => ({
    value: prediction?.structured_formatting?.main_text ?? prediction?.description,
    label: prediction?.description ?? prediction?.structured_formatting?.main_text,
  }));

  return NextResponse.json({ items });
}

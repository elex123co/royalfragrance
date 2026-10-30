import { NextResponse } from "next/server";
import { extractGalleryItem, composeGalleryItem } from "@/lib/actions/admin-gallery";

// Each step is its own request so several photos can be worked on at once
// and no single request runs long enough to time out.
export async function POST(request: Request) {
  try {
    const { op, id, force } = await request.json();
    if (typeof id !== "string") return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    if (op === "extract") return NextResponse.json(await extractGalleryItem(id));
    if (op === "compose") return NextResponse.json(await composeGalleryItem(id, { force: !!force }));
    return NextResponse.json({ success: false, error: "Unknown step" }, { status: 400 });
  } catch (e: any) {
    const unauthorized = /authenticated|authorized/i.test(e?.message ?? "");
    return NextResponse.json({ success: false, error: e?.message ?? "Failed" }, { status: unauthorized ? 401 : 500 });
  }
}

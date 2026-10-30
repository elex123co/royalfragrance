import { NextResponse } from "next/server";
import { addGalleryImage } from "@/lib/actions/admin-gallery";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await addGalleryImage(formData);
    return NextResponse.json(result);
  } catch (e: any) {
    const unauthorized = /authenticated|authorized/i.test(e?.message ?? "");
    return NextResponse.json({ success: false, error: e?.message ?? "Upload failed" }, { status: unauthorized ? 401 : 500 });
  }
}

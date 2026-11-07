import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";

export const alt = "Royal Fragrance vendor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The vendor's shareable card. It is the picture WhatsApp, Instagram and
 * other apps show when the vendor's link is posted, so people tap the card
 * to open the catalogue. The vendor can also download or share it directly.
 */
export default async function Image({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).toUpperCase();
  let name = "ROYAL FRAGRANCE";
  let place: string | null = null;
  let isVendor = false;

  try {
    const admin = createAdminClient();
    const { data: vendor } = await admin
      .from("vendors")
      .select("business_name, display_name, status, vendor_type, batch_location_id")
      .eq("vendor_code", code)
      .maybeSingle();
    if (vendor && vendor.status === "active") {
      name = String(vendor.display_name || vendor.business_name).toUpperCase();
      isVendor = true;
      if (vendor.batch_location_id) {
        const { data: loc } = await admin
          .from("batch_locations")
          .select("name")
          .eq("id", vendor.batch_location_id)
          .maybeSingle();
        place = loc?.name ?? null;
      }
    }
  } catch {
    // fall back to the plain brand card
  }

  const fontSize = name.length > 22 ? 64 : name.length > 14 ? 84 : 110;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(135deg, #2b1a12 0%, #5b3a27 100%)",
          color: "#f6ede2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: "#d4a574" }}>ROYAL FRAGRANCE</div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 3,
              border: "2px solid #d4a574",
              color: "#d4a574",
              padding: "8px 22px",
              borderRadius: 999,
            }}
          >
            {isVendor ? "OFFICIAL VENDOR" : "LUXURY PERFUMES"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {isVendor && (
            <div style={{ display: "flex", fontSize: 34, color: "#d4a574", letterSpacing: 10 }}>VEND</div>
          )}
          <div style={{ display: "flex", fontSize, fontWeight: 700, lineHeight: 1.05, marginTop: 8 }}>{name}</div>
          {place && (
            <div style={{ display: "flex", fontSize: 34, marginTop: 18, color: "#e9d7c3" }}>{`Serving ${place}`}</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#f6ede2" }}>Tap to see my perfume catalogue and order</div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              background: "#d4a574",
              color: "#2b1a12",
              padding: "14px 30px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            View catalogue
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

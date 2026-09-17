import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Royal Fragrance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788705368/WhatsApp_Image_2026-09-05_at_17.32.39__1_-removebg-preview_1_qaxnfw.png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#70452F",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          width={420}
          height={420}
          alt="Royal Fragrance"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size }
  );
}

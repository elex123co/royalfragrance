import type { MetadataRoute } from "next";

const LOGO_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788705368/WhatsApp_Image_2026-09-05_at_17.32.39__1_-removebg-preview_1_qaxnfw.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Royal Fragrance",
    short_name: "Royal Fragrance",
    description:
      "Wear the scent of royalty — shop premium fragrances from Royal Fragrance.",
    start_url: "/",
    display: "standalone",
    background_color: "#E8D7C5",
    theme_color: "#1E120C",
    icons: [
      { src: LOGO_URL, sizes: "192x192", type: "image/png" },
      { src: LOGO_URL, sizes: "512x512", type: "image/png" },
      { src: LOGO_URL, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

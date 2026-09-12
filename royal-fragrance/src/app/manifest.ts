import type { MetadataRoute } from "next";

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
      // /favicon.svg has the brown circular background baked in behind the
      // logo. The raw LOGO_URL is fully transparent — for a "maskable"
      // icon especially, Android's adaptive-icon system expects an opaque
      // fill all the way to the edges, and falls back to black wherever
      // it finds transparency instead. Using the same composited SVG here
      // as the favicon fixes the splash screen for the same reason it
      // fixed the browser tab icon.
      { src: "/favicon.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/favicon.svg", sizes: "512x512", type: "image/svg+xml" },
      { src: "/favicon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

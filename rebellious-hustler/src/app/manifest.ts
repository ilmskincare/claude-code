import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rebellious Hustler",
    short_name: "Rebellious Hustler",
    description: "Birmingham streetwear for the whole family.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/brand/rebellious-hustler-crest-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/rebellious-hustler-crest-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    // SVGs in /public/illustrations sind von uns selbst erstellt und
    // enthalten kein eingebettetes JS. next/image blockiert SVGs
    // standardmäßig aus Sicherheitsgründen — hier explizit erlauben.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  // Puppeteer + @sparticuz/chromium müssen außerhalb des Webpack-Bundles
  // bleiben, sonst werden die mitgelieferten .br-Shared-Libraries
  // (libnss3.so.br u. a.) wegoptimiert und Chromium startet auf Vercel mit
  // "libnss3.so: cannot open shared object file" nicht mehr.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;

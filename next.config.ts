import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  // Puppeteer + @sparticuz/chromium dürfen nicht gebündelt werden:
  // Webpack würde sonst die brotli-komprimierten Binaries (chromium.br,
  // libnss3.so.br, …) im bin/-Ordner entfernen, die das Modul zur Laufzeit
  // nach /tmp entpackt. Ohne diese Libs scheitert der Start mit
  // "libnss3.so: cannot open shared object file".
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;

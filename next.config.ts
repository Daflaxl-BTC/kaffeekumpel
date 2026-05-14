import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  // Puppeteer + @sparticuz/chromium dürfen nicht gebündelt werden – Webpack
  // würde sonst die brotli-komprimierten Binaries im bin/-Ordner verwerfen.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // ABER: `serverExternalPackages` allein reicht auf Vercel nicht. Der
  // File-Tracer folgt nur statischen Imports; die `.br`-Archive
  // (chromium.br, libnss3.so.br, libnssutil3.so.br, libsmime3.so.br,
  // libsoftokn3.so.br, swiftshader.tar.br, …) werden zur Laufzeit über
  // dynamische fs-Pfade in /tmp entpackt. Ohne explizites Tracing landen
  // sie nicht im Lambda-Bundle und der Start scheitert mit
  // "libnss3.so: cannot open shared object file".
  //
  // outputFileTracingIncludes zwingt Next.js, den kompletten bin/-Ordner
  // mit auszuliefern. Das ist die offizielle Lösung für serverless Chromium.
  outputFileTracingIncludes: {
    "/api/recap/**": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

export default nextConfig;

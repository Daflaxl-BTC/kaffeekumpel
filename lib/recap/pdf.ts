/**
 * Rendert das Recap-HTML zu PDF-Bytes.
 *
 * Zwei Modi:
 *   - Lokale Entwicklung: nutzt System-Chrome/Edge via PUPPETEER_EXECUTABLE_PATH
 *     oder auto-detect. Sehr schnell, keine 200-MB-Chromium-Downloads.
 *   - Serverless (Vercel/Lambda): nutzt @sparticuz/chromium (small binary).
 *
 * Die Umschaltung passiert über `process.env.NODE_ENV`.
 *
 * Wichtig: Node Runtime (nicht Edge) – in `app/api/recap/[slug]/route.ts`
 * muss `export const runtime = "nodejs"` stehen.
 */

import type { Browser, LaunchOptions } from "puppeteer-core";

/**
 * Kandidaten für lokale Chrome/Edge-Installationen, wenn nichts via
 * PUPPETEER_EXECUTABLE_PATH gesetzt ist. Reihenfolge: macOS, Windows, Linux.
 */
const LOCAL_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

async function findLocalExecutable(): Promise<string | null> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const { access } = await import("node:fs/promises");
  for (const p of LOCAL_CANDIDATES) {
    try {
      await access(p);
      return p;
    } catch {
      // weiter probieren
    }
  }
  return null;
}

async function launchLocal(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  const execPath = await findLocalExecutable();
  if (!execPath) {
    throw new Error(
      "Kein lokaler Chrome/Edge gefunden. " +
        "Setz PUPPETEER_EXECUTABLE_PATH auf dein Browser-Binary " +
        "oder installiere Google Chrome.",
    );
  }
  const opts: LaunchOptions = {
    executablePath: execPath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  return puppeteer.default.launch(opts);
}

interface SparticuzChromium {
  args: string[];
  defaultViewport: LaunchOptions["defaultViewport"];
  headless: boolean | "shell";
  executablePath: (path?: string) => Promise<string>;
}

async function launchServerless(): Promise<Browser> {
  const [puppeteer, chromiumMod] = await Promise.all([
    import("puppeteer-core"),
    import("@sparticuz/chromium"),
  ]);
  // @sparticuz/chromium: default export ist das Chromium-Objekt,
  // die TypeScript-Typen sind aber das Class-Shape – runtime-lookup.
  const chromium = (chromiumMod as unknown as { default: SparticuzChromium })
    .default;
  return puppeteer.default.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless as LaunchOptions["headless"],
  });
}

export async function renderHtmlToPdf(html: string): Promise<Uint8Array> {
  const isProd =
    process.env.VERCEL === "1" ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.NODE_ENV === "production";

  const browser = isProd ? await launchServerless() : await launchLocal();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}

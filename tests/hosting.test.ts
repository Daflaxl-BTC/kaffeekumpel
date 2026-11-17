import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { hostingProvider, privacyHostingText } from "../lib/hosting";
import { supabaseServerUrl } from "../lib/supabase/server";

const root = path.resolve(__dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("hostingProvider", () => {
  it("ist ohne Variable vercel (heutige Produktion)", () => {
    expect(hostingProvider(undefined)).toBe("vercel");
    expect(hostingProvider("")).toBe("vercel");
    expect(hostingProvider("irgendwas")).toBe("vercel");
  });

  it("erkennt hetzner unabhängig von Schreibweise", () => {
    expect(hostingProvider("hetzner")).toBe("hetzner");
    expect(hostingProvider(" Hetzner ")).toBe("hetzner");
  });
});

describe("Datenschutztext Hosting", () => {
  it("Vercel-Variante nennt Vercel und Supabase Inc.", () => {
    const text = privacyHostingText("vercel").paragraphs.join(" ");
    expect(text).toContain("Vercel Inc.");
    expect(text).toContain("Supabase Inc.");
    expect(text).toContain("USA");
  });

  it("Hetzner-Variante verspricht Deutschland und nennt keine US-Anbieter als Hoster", () => {
    const text = privacyHostingText("hetzner").paragraphs.join(" ");
    expect(text).toContain("Hetzner Online GmbH");
    expect(text).toContain("Deutschland");
    expect(text).not.toContain("Vercel");
    expect(text).not.toContain("USA");
    expect(text).not.toContain("Standardvertragsklauseln");
  });

  it("Aufbewahrung im Text passt zum Backup-Skript", () => {
    const text = privacyHostingText("hetzner").paragraphs.join(" ");
    const keep = /KEEP_DAYS="\$\{KEEP_DAYS:-(\d+)\}"/.exec(read("scripts/hetzner/backup.sh"))?.[1];
    expect(keep).toBeDefined();
    expect(text).toContain(`${keep} Tage`);
  });

  it("kein Zugriffsprotokoll: Caddyfile hat keinen log-Block", () => {
    const directives = read("Caddyfile")
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");
    expect(directives).not.toMatch(/^\s*log\b/m);
  });

  it("Docker-Image (Hetzner) schaltet auf hetzner um", () => {
    expect(read("Dockerfile")).toMatch(/HOSTING_PROVIDER=hetzner/);
  });
});

describe("supabaseServerUrl", () => {
  it("nimmt auf Hetzner die interne Kong-Adresse", () => {
    expect(
      supabaseServerUrl({
        SUPABASE_INTERNAL_URL: "http://kong:8000",
        NEXT_PUBLIC_SUPABASE_URL: "https://api.kaffeekumpel.eu",
      }),
    ).toBe("http://kong:8000");
  });

  it("fällt ohne interne Adresse auf NEXT_PUBLIC_SUPABASE_URL zurück (Vercel)", () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" };
    expect(supabaseServerUrl(env)).toBe("https://x.supabase.co");
    expect(supabaseServerUrl({ ...env, SUPABASE_INTERNAL_URL: "  " })).toBe(
      "https://x.supabase.co",
    );
  });
});

describe("Hetzner-Skripte", () => {
  const dir = path.join(root, "scripts/hetzner");
  const scripts = readdirSync(dir).filter((f) => f.endsWith(".sh"));

  it("sind vorhanden", () => {
    expect(scripts.sort()).toEqual(["backup.sh", "migrate-data.sh", "restore-dump.sh", "verify-migration.sh"]);
  });

  it.each(scripts)("%s ist gültiges Bash und bricht bei Fehlern ab", (file) => {
    const full = path.join(dir, file);
    expect(() => execFileSync("bash", ["-n", full])).not.toThrow();
    expect(readFileSync(full, "utf8")).toContain("set -euo pipefail");
  });
});

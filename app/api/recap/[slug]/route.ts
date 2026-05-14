/**
 * GET /api/recap/[slug]?period=month|year&ref=2026-03
 *
 *   ?period   – "month" | "year"        (default: month)
 *   ?ref      – für month: "YYYY-MM"; für year: "YYYY"
 *               fehlt → letzter abgeschlossener Monat / Vorjahr
 *   ?preview  – "html" liefert das HTML direkt (Debug-Hilfe),
 *               sonst PDF als application/pdf mit Download-Header.
 *
 * Auth: signed Session-Cookie für den Slug muss vorhanden sein – der
 * Recap enthält Beträge und Namen, also nicht öffentlich.
 *
 * Runtime: nodejs (Puppeteer braucht's).
 */

import { NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/auth/session";
import { isValidSlug } from "@/lib/slug";
import { buildRecapInput } from "@/lib/recap/aggregate";
import { enrichRecapWithClaude } from "@/lib/recap/generate";
import { renderRecapHtml } from "@/lib/recap/template";
import { renderHtmlToPdf } from "@/lib/recap/pdf";
import {
  clientIpFromHeaders,
  rateLimit,
  sanitizeErrorMsg,
  validateRef,
} from "@/lib/recap/guard";
import type { RecapPeriod } from "@/lib/recap/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel: genug Zeit für Claude + Chromium

function defaultRefForPeriod(period: RecapPeriod): string {
  const now = new Date();
  if (period === "year") {
    return String(now.getUTCFullYear() - 1);
  }
  // letzter abgeschlossener Monat
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0..11; Vormonat = m-1
  const prev = new Date(Date.UTC(y, m - 1, 1));
  const pm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  return `${prev.getUTCFullYear()}-${pm}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return new NextResponse("Invalid slug", { status: 400 });
  }

  const session = await readSessionCookie(slug);
  if (!session) {
    return new NextResponse("Unauthorized – tritt erst der Gruppe bei.", {
      status: 401,
    });
  }

  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period") === "year" ? "year" : "month";
  const refParam = url.searchParams.get("ref") ?? defaultRefForPeriod(periodParam);
  const preview = url.searchParams.get("preview");

  // Strikte Eingangs-Validierung von ?ref bevor wir Claude-Tokens ausgeben
  // oder Chromium hochfahren. parsePeriod() in aggregate.ts validiert auch –
  // hier ist es Defense-in-Depth.
  if (!validateRef(periodParam, refParam)) {
    return new NextResponse("Invalid ref", { status: 400 });
  }

  // Rate-Limit pro (slug, IP). Schützt das Anthropic-Token-Budget gegen
  // versehentliche Loop-Klicks oder Schnell-Klick-Skripte. Die eigentliche
  // DDoS-Abwehr macht Vercel/Cloudflare davor.
  const ip = clientIpFromHeaders(req.headers);
  const limit = rateLimit(`${slug}:${ip}`);
  if (!limit.ok) {
    return new NextResponse("Zu viele Anfragen. Probier's gleich nochmal.", {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSec) },
    });
  }
  // Recap-PDFs werden geteilt, gespeichert und gedruckt – der eingebettete
  // QR-Code und die Footer-URL müssen unabhängig vom Deploy-Host immer auf
  // die Produktions-Domain zeigen, sonst friert ein Vercel-Preview-Host
  // dauerhaft im PDF ein.
  const appUrl = "https://kaffeekumpel.eu";

  let recap;
  try {
    const base = await buildRecapInput({
      slug,
      period: periodParam,
      ref: refParam,
      appUrl,
    });
    recap = await enrichRecapWithClaude(base);
  } catch (err) {
    // Volle Details ins Server-Log (Stack, Pfade) – nach außen nur eine
    // generische Meldung, damit weder Datenbank-Layout noch interne Pfade
    // im UI auftauchen.
    console.error("[recap] Aggregation/Claude failed", {
      slug,
      period: periodParam,
      ref: refParam,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return new NextResponse(sanitizeErrorMsg("aggregate"), { status: 500 });
  }

  const html = renderRecapHtml(recap);

  if (preview === "html") {
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let pdf: Uint8Array;
  try {
    pdf = await renderHtmlToPdf(html);
  } catch (err) {
    console.error("[recap] PDF rendering failed", {
      slug,
      period: periodParam,
      ref: refParam,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return new NextResponse(sanitizeErrorMsg("render"), { status: 500 });
  }

  const fileName = `kaffeekumpel-${slug}-${refParam}.pdf`;
  // pdf ist Uint8Array – via Blob in eine BodyInit-kompatible Form bringen
  const body = new Blob([new Uint8Array(pdf)], { type: "application/pdf" });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

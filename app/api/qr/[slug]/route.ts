import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { isValidSlug } from "@/lib/slug";

/**
 * QR-Code-Endpoint für das Holzschild.
 *
 * ?format=svg  → Vektor (ideal für Laser-Gravur)
 * ?format=png  → 1024x1024 (Druck / Digital)
 *
 * Fehlerkorrektur-Level H (30%): überlebt auch Kratzer & Schleif-Abnutzung
 * auf Holz. Wichtig für Küchen-Umgebung.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return new NextResponse("Invalid slug", { status: 400 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  // QR-Codes landen auf gravierten Holzschildern – sie sind physisch
  // unveränderlich und müssen deshalb immer auf den kanonischen Host
  // zeigen, unabhängig davon, von welchem Vercel-Deploy sie generiert wurden.
  const target = `https://kaffeekumpel.eu/g/${slug}`;

  if (format === "svg") {
    const svg = await QRCode.toString(target, {
      errorCorrectionLevel: "H",
      type: "svg",
      margin: 2,
      color: { dark: "#2E1D10", light: "#FAF6F1" },
    });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const buf = await QRCode.toBuffer(target, {
    errorCorrectionLevel: "H",
    type: "png",
    width: 1024,
    margin: 2,
    color: { dark: "#2E1D10", light: "#FAF6F1" },
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

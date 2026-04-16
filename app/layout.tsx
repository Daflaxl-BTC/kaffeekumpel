import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaffeekumpel — die digitale Kaffeekasse",
  description:
    "QR-Code an die Maschine, ein Tap pro Kaffee, automatische Abrechnung. Für WGs, Büros und Coworking-Crews.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#8B5A2B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}

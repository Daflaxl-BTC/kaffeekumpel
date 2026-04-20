"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isValidSlug, normalizeSlug } from "@/lib/slug";

function slugFromScan(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    const m = u.pathname.match(/^\/g\/([^/]+)/);
    if (m) {
      const candidate = normalizeSlug(m[1]);
      if (isValidSlug(candidate)) return candidate;
    }
  } catch {
    // not a URL — fall through
  }
  const candidate = normalizeSlug(trimmed);
  return isValidSlug(candidate) ? candidate : null;
}

export function LoginClient() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopScanner = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  useEffect(() => stopScanner, []);

  const startScanner = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Kein Kamera-Zugriff möglich auf diesem Gerät. Tipp den 6-stelligen Code unten manuell ein.",
      );
      return;
    }

    try {
      const [{ default: jsQR }, stream] = await Promise.all([
        import("jsqr"),
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        }),
      ]);
      streamRef.current = stream;
      setScanning(true);

      // Video-Element ist erst nach Render gemountet — warten.
      await new Promise((r) => requestAnimationFrame(r));
      const video = videoRef.current;
      if (!video) {
        stopScanner();
        return;
      }
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        stopScanner();
        setError("Canvas konnte nicht initialisiert werden.");
        return;
      }

      let done = false;
      const tick = () => {
        if (done || !videoRef.current) return;
        const v = videoRef.current;
        if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth > 0) {
          // Für Performance: runterskalieren auf max 480px Kante.
          const max = 480;
          const scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
          const w = Math.round(v.videoWidth * scale);
          const h = Math.round(v.videoHeight * scale);
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;
          ctx.drawImage(v, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const result = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
          if (result) {
            const slug = slugFromScan(result.data);
            if (slug) {
              done = true;
              stopScanner();
              toast.success("Code erkannt — weiter geht's!");
              router.push(`/g/${slug}`);
              return;
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      stopScanner();
      const msg =
        e instanceof Error && e.name === "NotAllowedError"
          ? "Kamera-Zugriff wurde blockiert. Erlaub ihn in den Browser-Einstellungen und versuch's nochmal."
          : "Kamera konnte nicht gestartet werden. Tipp den 6-stelligen Code unten manuell ein.";
      setError(msg);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = normalizeSlug(manualCode);
    if (!isValidSlug(slug)) {
      toast.error("Der Code hat 6 Zeichen (Buchstaben & Zahlen).");
      return;
    }
    router.push(`/g/${slug}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 rounded-2xl p-6 border border-kaffee-100">
        {scanning ? (
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                playsInline
              />
              <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={stopScanner}
            >
              <CameraOff className="w-4 h-4" /> Scan abbrechen
            </Button>
            <p className="text-xs text-kaffee-700/70 text-center">
              Halt den QR-Code vollständig ins Bild.
            </p>
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={startScanner}
          >
            <Camera className="w-5 h-5" /> QR-Code scannen
          </Button>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-kaffee-700/70">
        <div className="flex-1 border-t border-kaffee-100" />
        oder
        <div className="flex-1 border-t border-kaffee-100" />
      </div>

      <form
        onSubmit={submitManual}
        className="space-y-4 bg-white/80 rounded-2xl p-6 border border-kaffee-100"
      >
        <div>
          <label
            htmlFor="slug"
            className="flex items-center gap-2 text-sm font-medium text-kaffee-900 mb-1"
          >
            <Keyboard className="w-4 h-4" /> Code manuell eingeben
          </label>
          <input
            id="slug"
            name="slug"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            maxLength={10}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            placeholder="H3K7QP"
            className="w-full rounded-xl border border-kaffee-100 bg-white px-4 py-3 font-mono text-xl tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-kaffee-500"
          />
          <p className="mt-1 text-xs text-kaffee-700/70">
            6 Zeichen, steht unter dem QR-Code am Holzschild.
          </p>
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={normalizeSlug(manualCode).length !== 6}
        >
          Zur Gruppe →
        </Button>
      </form>
    </div>
  );
}

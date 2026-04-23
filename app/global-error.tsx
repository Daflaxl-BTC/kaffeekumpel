"use client";

import { useEffect } from "react";

/**
 * Greift nur, wenn app/layout.tsx selbst crashed (sehr selten).
 * Muss eigenes <html>/<body> rendern, weil Layout fehlt.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "28rem", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Kaffeekumpel ist kurz umgefallen.
        </h1>
        <p style={{ marginTop: "0.5rem", color: "#574236" }}>
          Bitte lad die Seite neu. Falls das Problem bleibt, schreib uns an
          felix.bredl@gmail.com.
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#8a6f5f", marginTop: "1rem" }}>
            Ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.25rem",
            background: "#8B5A2B",
            color: "#fff",
            border: 0,
            borderRadius: "0.75rem",
            cursor: "pointer",
          }}
        >
          Nochmal versuchen
        </button>
      </body>
    </html>
  );
}

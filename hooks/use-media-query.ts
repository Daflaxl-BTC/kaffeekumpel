"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe Media-Query-Hook. Initial-Wert ist `false`, damit Server-Render
 * deterministisch bleibt (sonst Hydration-Mismatch). Echter Wert wird im
 * useEffect nachgesetzt.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

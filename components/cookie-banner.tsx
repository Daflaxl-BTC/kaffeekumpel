"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Minimaler Cookie-Hinweis. Da wir nur ein technisch notwendiges Session-
 * Cookie setzen (kein Tracking, kein Analytics), brauchen wir nach TTDSG/DSGVO
 * keine Consent-Einholung — aber einen transparenten Hinweis.
 * Akzeptanz wird in localStorage gemerkt, damit der Banner beim nächsten
 * Besuch nicht wiederkommt.
 */

const STORAGE_KEY = "kk_cookie_ack_v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      // Privacy-Modus o.ä. — einfach nicht zeigen, ist nicht kritisch.
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-kaffee-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
      <p className="text-sm text-kaffee-900">
        Wir setzen nur ein technisch notwendiges Cookie
        (<span className="font-mono text-xs">kk_session</span>), damit du auf
        diesem Gerät eingeloggt bleibst. Kein Tracking, keine Werbung.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg bg-kaffee-700 px-3 py-1.5 font-medium text-white hover:bg-kaffee-900"
        >
          Verstanden
        </button>
        <Link
          href="/datenschutz"
          className="text-kaffee-700 underline hover:text-kaffee-900"
        >
          Details
        </Link>
      </div>
    </div>
  );
}

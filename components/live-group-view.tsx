"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";

interface Props {
  slug: string;
  groupId: string;
  initialEvents: { id: string }[];
  children: React.ReactNode;
}

/**
 * Wrapper der die Gruppenansicht live hält: bei neuen events wird die Page
 * revalidiert. Visueller "Live"-Dot zeigt dem User dass gerade Realtime läuft.
 */
export function LiveGroupView({ slug, groupId, children }: Props) {
  const router = useRouter();
  const { connected } = useRealtimeEvents({
    groupId,
    onInsert: () => router.refresh(),
  });

  useEffect(() => {
    // Page auch bei Tab-Fokus refreshen
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  return (
    <div className="relative">
      <div className="fixed top-2 right-2 z-10 flex items-center gap-1 text-xs bg-white/80 backdrop-blur rounded-full px-2 py-1 border border-kaffee-100">
        <span
          className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-kaffee-300"}`}
          aria-label={connected ? "Live" : "Offline"}
        />
        <span className="text-kaffee-700">
          {connected ? "Live" : "Offline"}
        </span>
        <span className="opacity-50">·</span>
        <span className="font-mono text-kaffee-700">{slug}</span>
      </div>
      {children}
    </div>
  );
}

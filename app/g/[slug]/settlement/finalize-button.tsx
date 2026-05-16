"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { finalizeSettlement } from "./actions";

export function FinalizeButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();

  const handle = () => {
    if (!confirm("Abrechnung wirklich jetzt abschließen?")) return;
    const fd = new FormData();
    fd.set("slug", slug);
    startTransition(async () => {
      try {
        await finalizeSettlement(fd);
        toast.success("Abrechnung abgeschlossen!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      }
    });
  };

  return (
    <Button onClick={handle} loading={pending} size="md">
      {pending ? "Schließt ab…" : "Jetzt abschließen"}
    </Button>
  );
}

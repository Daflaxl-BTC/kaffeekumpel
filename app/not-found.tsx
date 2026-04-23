import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <main className="min-h-screen px-6 py-16 max-w-md mx-auto text-center">
        <div className="text-5xl mb-4">☕🔍</div>
        <h1 className="text-3xl font-bold text-kaffee-900 mb-2">
          Hier ist nix.
        </h1>
        <p className="text-kaffee-700 mb-8">
          Die Seite existiert nicht (mehr). Vielleicht hast du einen alten
          Link erwischt oder den Code falsch getippt.
        </p>
        <Link href="/">
          <Button size="lg">Zur Startseite</Button>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

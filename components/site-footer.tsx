import Link from "next/link";
import { DEFAULT_CONTACT_EMAIL } from "@/lib/legal";

export function SiteFooter({
  variant = "default",
}: {
  variant?: "default" | "muted";
}) {
  const cls = variant === "muted" ? "text-kaffee-700/70" : "text-kaffee-800";
  const email = process.env.IMPRESSUM_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;
  return (
    <footer className={`relative z-10 px-6 py-8 text-center text-sm ${cls}`}>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/impressum" className="hover:underline underline-offset-4">
          Impressum
        </Link>
        <span aria-hidden>·</span>
        <Link href="/datenschutz" className="hover:underline underline-offset-4">
          Datenschutz
        </Link>
        <span aria-hidden>·</span>
        <a href={`mailto:${email}`} className="hover:underline underline-offset-4">
          Kontakt
        </a>
      </nav>
    </footer>
  );
}

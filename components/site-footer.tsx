import Link from "next/link";

export function SiteFooter({
  variant = "default",
}: {
  variant?: "default" | "muted";
}) {
  const cls =
    variant === "muted"
      ? "text-kaffee-700/60"
      : "text-kaffee-700/80";
  return (
    <footer
      className={`relative z-10 px-6 py-8 text-center text-xs ${cls}`}
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/impressum" className="hover:underline">
          Impressum
        </Link>
        <span aria-hidden>·</span>
        <Link href="/datenschutz" className="hover:underline">
          Datenschutz
        </Link>
        <span aria-hidden>·</span>
        <a
          href="mailto:felix.bredl@gmail.com"
          className="hover:underline"
        >
          Kontakt
        </a>
      </nav>
      <p className="mt-3">
        Open Source · DSGVO-konform · EU-Hosting
      </p>
    </footer>
  );
}

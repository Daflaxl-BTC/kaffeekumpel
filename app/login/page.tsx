import { LoginClient } from "./login-client";

export const metadata = {
  title: "Gruppe beitreten — Kaffeekumpel",
  description:
    "Scanne den QR-Code deiner Gruppe oder gib den 6-stelligen Code ein.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen px-6 py-12 max-w-md mx-auto">
      <a
        href="/"
        className="text-sm text-kaffee-700 hover:underline inline-block mb-4"
      >
        ← zurück
      </a>
      <h1 className="text-3xl font-bold text-kaffee-900 mb-2">
        Schon eine Gruppe?
      </h1>
      <p className="text-kaffee-700 mb-8">
        Scan den QR-Code an der Kaffeemaschine oder tipp den 6-stelligen Code
        ein, den dir jemand aus der Gruppe geschickt hat.
      </p>

      <LoginClient />
    </main>
  );
}

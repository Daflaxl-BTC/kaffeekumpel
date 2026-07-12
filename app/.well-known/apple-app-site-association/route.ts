/**
 * Universal Links: iOS lädt diese Datei beim App-Install/Update und lernt,
 * welche URLs die App öffnen darf. MUSS als application/json ohne Datei-Suffix
 * unter https://kaffeekumpel.eu/.well-known/apple-app-site-association liegen.
 *
 * appID = <TeamID>.<BundleID> — TeamID aus Apple Developer → Membership,
 * BundleID = das der iOS-App (z.B. eu.kaffeekumpel.app). Über Env setzbar,
 * damit die echte TeamID nicht im Repo landet; Fallback ist ein Platzhalter.
 *
 * Pfade `/g/*` = Gruppenansicht (NFC-Tag/QR-Ziel) öffnet die App statt Safari.
 */

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET() {
  const appID =
    process.env.IOS_APP_ID ?? "TEAMID.eu.kaffeekumpel.app";

  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID,
          paths: ["/g/*"],
        },
      ],
    },
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

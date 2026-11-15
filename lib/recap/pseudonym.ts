/**
 * Pseudonymisierung für den KI-Rückblick.
 *
 * Gruppen- und Mitgliedernamen verlassen den Server nicht: Wir schicken
 * Platzhalter an die KI und setzen die echten Namen erst in der Antwort
 * wieder ein. So bleiben personenbezogene Angaben auf unserem Server.
 */

export const GROUP_ALIAS = "[GRUPPE]";
export const MEMBER_ALIAS = "[NAME]";

export interface RestoreNames {
  group: string;
  member?: string;
}

/** Ersetzt Platzhalter in KI-Text durch echte Namen. */
export function restoreNames(text: string, names: RestoreNames): string {
  let out = text.split(GROUP_ALIAS).join(names.group);
  out = out.split(MEMBER_ALIAS).join(names.member ?? "");
  // Falls die KI den Platzhalter leicht abwandelt (z. B. ohne Klammern):
  out = out.replace(/\[\s*GRUPPE\s*\]/gi, names.group);
  if (names.member) out = out.replace(/\[\s*NAME\s*\]/gi, names.member);
  return out.replace(/\s{2,}/g, " ").trim();
}

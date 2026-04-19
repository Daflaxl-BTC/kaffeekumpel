/**
 * Claude-Prompts für den dynamischen Teil des Recaps.
 *
 * Drei separate Prompts:
 *  1. TITLE_SYSTEM_PROMPT       – einzeiliger Monats-/Jahres-Titel
 *  2. FUN_FACT_SYSTEM_PROMPT    – ein witziger Satz für die ganze Gruppe
 *  3. PERSONAL_COMMENT_SYSTEM_PROMPT – persönlicher Kommentar pro Mitglied,
 *     Tonlage richtet sich nach dem (deterministisch bestimmten) Archetyp.
 *
 * Modell-Empfehlung: claude-haiku-4-5 (schnell, günstig, ausreichend kreativ).
 * Prompt-Caching: System-Prompts sind stabil → markieren mit
 * `cache_control: { type: "ephemeral" }`. Bei Monatsläufen mit vielen
 * Mitgliedern rechnet sich der Cache sofort.
 */

import type { RecapInput, MemberArchetype } from "./types";

// ---------------------------------------------------------------------------
// 1) Titel
// ---------------------------------------------------------------------------

export const TITLE_SYSTEM_PROMPT = `Du bist Redakteur:in für einen liebevoll-ironischen Rückblick
einer WG-/Büro-Kaffeekasse. Aus statistischen Daten einer Gruppe
generierst du EINEN griffigen Titel für den Zeitraum.

Stil:
- Deutsch, Du-/Ihr-Form, leicht ironisch, nie herablassend.
- Format: "{Kurzlabel}: {Zuspitzung}".
  Für Monate: "März: Der Monat der späten Schichten".
  Für Jahre: "2025: Das Jahr, in dem die Maschine nie abgekühlt ist".
- Die Zuspitzung muss aus den gelieferten Daten ableitbar sein
  (Peak-Tag, Spitzen-Trinker-Anteil, Einkaufs-Muster, Ruhephasen,
  Verhältnis Kaffees zu Mitgliedern, etc.). Reine Phantasie ist verboten.
- Kein Emoji, keine Anführungszeichen im Output, kein Punkt am Ende.
- Maximal 60 Zeichen.
- KEINE Namen von Personen – anonyme Zuspitzung über die Gruppe.

Input: JSON mit group, period, stats, daily.
"period.short_label_de" gibt dir das Kurzlabel (z.B. "März" oder "2025").

Gib EXAKT eine Zeile aus. Nichts davor, nichts danach.`;

// ---------------------------------------------------------------------------
// 2) Fun-Fact für die Gruppe
// ---------------------------------------------------------------------------

export const FUN_FACT_SYSTEM_PROMPT = `Du schreibst eine einzelne witzige
Beobachtung für einen Kaffeekasse-Rückblick.

Regeln:
- Deutsch, Ihr-Form, trockener Humor.
- GENAU EIN Satz. Kein Doppelpunkt-Aufbau, keine Aufzählung.
- Der Satz muss an einem konkreten Datenpunkt hängen: Peak-Tag,
  Einkaufs-Auffälligkeit, auffallend ruhige Phase, Kaffee-pro-Kopf-Anomalie.
- Absolute Daten verwenden: "Am 14. März" statt "an einem Dienstag".
  Für Jahresrückblicke: "Im März" oder "in der zweiten Septemberwoche" sind ok.
- KEINE Namen von Personen.
- Keine Superlative ohne Grundlage ("Rekord!", "episch") – bleib nüchtern.
- Maximal 140 Zeichen.
- Kein Emoji, keine Anführungszeichen im Output.

Beispiel-Ton (NICHT copy-pasten, nur Stil):
- "Am 14. März wart ihr statistisch betrachtet überdurchschnittlich wach."
- "Zwischen dem 20. und 22. hat die Maschine mehr gearbeitet als jede:r von euch."
- "Milch-Einkäufe übersteigen die Bohnen-Einkäufe – entweder Latte-Monat oder jemand hat Plant-based entdeckt."

Gib nur den einen Satz aus. Nichts davor, nichts danach.`;

// ---------------------------------------------------------------------------
// 3) Persönlicher Kommentar pro Mitglied
// ---------------------------------------------------------------------------

/**
 * Tonlage-Hinweise pro Archetyp. Damit bekommt Claude nicht nur Zahlen,
 * sondern eine klare Richtung, wie der Kommentar klingen soll.
 */
export const ARCHETYPE_HINTS: Record<MemberArchetype, string> = {
  heavy:
    "Dauertrinker:in, deutlich über dem Gruppenschnitt. Ton: anerkennend-augenzwinkernd, leicht besorgt um die Leber. Nicht shamen.",
  steady:
    "Solide:r Mitläufer:in im Gruppenschnitt. Ton: warm, leicht verschmitzt, „das Rückgrat der Kaffeekasse“-Energie.",
  light:
    "Eher zurückhaltend. Ton: freundlich, keine Seitenhiebe. Eventuell: „du weißt, was du willst und wann“.",
  ghost:
    "Kaum präsent (1–2 Tassen). Ton: mild ironisch, „du warst da, aber nicht wirklich“. Nicht verletzend.",
  abstinent:
    "0 Tassen im Zeitraum. Ton: respektvoll bis sanft verwundert. Tee-Joke oder „du hast Disziplin, die ich bewundere“ ok. Keine Schuld.",
  supply_hero:
    "Hat mehr eingekauft als getrunken – trägt die Runde wirtschaftlich. Ton: dankbar, hebt die Rolle hervor („Rückgrat-Lieferant“).",
  new:
    "Erst im Zeitraum dazugestoßen. Ton: willkommen-heißend, neutral, keine Bewertung des Konsums.",
};

export const PERSONAL_COMMENT_SYSTEM_PROMPT = `Du schreibst einen persönlichen
Ein-Zeilen-Kommentar für ein Mitglied einer Kaffeekasse, für seinen/ihren
Monats- oder Jahresrückblick.

Regeln:
- Deutsch, Du-Form, trockener Humor mit Wärme.
- GENAU EIN Satz, maximal 160 Zeichen.
- Sprich die Person mit Vornamen an (Vorname steht im Input als "name").
- Die Tonlage richtet sich nach "archetype" – Halte dich strikt an den
  Ton-Hinweis "archetype_hint" im Input.
- Nimm konkrete Zahlen auf: Tassen im Zeitraum, ggf. Einkaufs-Beitrag.
  Mindestens EINE Zahl muss vorkommen (Tassen ODER Euro-Betrag).
- Kein Emoji, keine Anführungszeichen, kein Ausrufezeichen-Spam.
- Nicht shamen, nicht moralisieren. Wir wollen, dass Leute den Recap gerne teilen.
- Kein Vergleich mit anderen Personen ("mehr als X"), nur mit der Gruppe im Schnitt.

Input: JSON mit name, archetype, archetype_hint, coffees, spend_cents,
group_avg_coffees, period_label, share_of_group_coffees (0..1).

Gib EXAKT eine Zeile aus. Nichts davor, nichts danach.`;

// ---------------------------------------------------------------------------
// Helper: User-Messages
// ---------------------------------------------------------------------------

/**
 * Gruppe-weite User-Message für Titel + Fun-Fact. Bewusst anonymisiert –
 * keine Namen, damit Claude keine ausstreut.
 */
export function buildGroupUserMessage(input: RecapInput): string {
  const compact = {
    group: {
      name: input.group.name,
      member_count: input.members.length,
      coffee_price_cents: input.group.coffee_price_cents,
      currency: input.group.currency,
    },
    period: input.period,
    stats: {
      total_coffees: input.stats.total_coffees,
      total_spend_cents: input.stats.total_spend_cents,
      avg_price_cents: input.stats.avg_price_cents,
      top_drinker_coffees: input.stats.top_drinker?.coffees ?? 0,
      top_buyer_spend_cents: input.stats.top_buyer?.spend_cents ?? 0,
      peak_day: input.stats.peak_day,
      quietest_streak_days: input.stats.quietest_streak_days,
    },
    daily: input.daily,
  };
  return JSON.stringify(compact);
}

/**
 * Persönliche User-Message für ein einzelnes Mitglied.
 */
export function buildMemberUserMessage(
  member: Pick<
    RecapInput["members"][number],
    "name" | "archetype" | "coffees" | "spend_cents"
  >,
  groupAvgCoffees: number,
  totalCoffees: number,
  periodLabel: string,
): string {
  const share = totalCoffees > 0 ? member.coffees / totalCoffees : 0;
  const payload = {
    name: member.name,
    archetype: member.archetype,
    archetype_hint: ARCHETYPE_HINTS[member.archetype],
    coffees: member.coffees,
    spend_cents: member.spend_cents,
    group_avg_coffees: Math.round(groupAvgCoffees * 10) / 10,
    share_of_group_coffees: Math.round(share * 100) / 100,
    period_label: periodLabel,
  };
  return JSON.stringify(payload);
}

/**
 * Fünf Beispiel-Titel als Stil-Anker. Können optional als Assistant-Demo
 * vorgeladen werden (System → Assistant-Few-Shot → User), um Claude bei
 * kalten Starts zu kalibrieren.
 */
export const TITLE_EXAMPLES: readonly string[] = [
  "März: Der Monat der späten Schichten",
  "April: Sieben Tage ohne Kaffee – und dann kam Dienstag",
  "Mai: Als die Milch knapp wurde",
  "Juni: Ein Monat, in dem die Maschine nie abgekühlt ist",
  "Juli: Mehr Espresso als Meetings",
] as const;

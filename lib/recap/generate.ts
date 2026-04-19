/**
 * Orchestriert die Claude-Calls für einen Recap:
 *   - 1× Titel
 *   - 1× Fun-Fact (gruppenweit)
 *   - n× persönlicher Kommentar (einer pro Mitglied, parallel)
 *
 * Modell: claude-haiku-4-5 (schnell, günstig, ausreichend kreativ).
 * Prompt-Caching: System-Prompts werden mit `cache_control: ephemeral`
 * markiert. Bei vielen Mitgliedern greift der Cache sofort → kostet fast nix.
 *
 * Das Modul schreibt die Ergebnisse direkt in ein `RecapInput` zurück
 * (`headline_title`, `fun_fact`, `members[*].personal_comment`).
 *
 * Fehler: Wenn ein einzelner Member-Call fehlschlägt oder der
 * ANTHROPIC_API_KEY fehlt, fallen wir auf einen harmlosen statischen Text
 * zurück statt den ganzen Recap zu kippen. Das PDF soll IMMER generierbar sein.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { RecapInput, RecapMember } from "./types";
import {
  FUN_FACT_SYSTEM_PROMPT,
  PERSONAL_COMMENT_SYSTEM_PROMPT,
  TITLE_SYSTEM_PROMPT,
  buildGroupUserMessage,
  buildMemberUserMessage,
} from "./prompts";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS_TITLE = 40;
const MAX_TOKENS_FUNFACT = 80;
const MAX_TOKENS_MEMBER = 120;

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

/**
 * Extrahiert die erste Text-Block-Antwort; trimmt umschließende Zeichen,
 * die Claude gelegentlich doch ausgibt (Backticks, Anführungszeichen).
 */
function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === "text") {
      return block.text
        .trim()
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

interface CallArgs {
  client: Anthropic;
  system: string;
  user: string;
  maxTokens: number;
}

async function callClaude({ client, system, user, maxTokens }: CallArgs): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: user }],
  });
  return extractText(response);
}

// ---------------------------------------------------------------------------
// Fallbacks (wenn API fehlt oder fehlschlägt)
// ---------------------------------------------------------------------------

function fallbackTitle(input: RecapInput): string {
  return `${input.period.short_label_de}: Der Rückblick`;
}

function fallbackFunFact(input: RecapInput): string {
  const peak = input.stats.peak_day;
  if (peak) {
    const day = parseInt(peak.date.slice(-2), 10);
    return `Am ${day}. wart ihr besonders aktiv – ${peak.coffees} Tassen an diesem Tag.`;
  }
  return `Zusammen ${input.stats.total_coffees} Tassen – die Maschine dankt.`;
}

function fallbackMemberComment(m: RecapMember): string {
  if (m.coffees === 0) {
    return `${m.name}, du hast diesen Zeitraum ohne eine einzige Tasse überstanden – Respekt.`;
  }
  if (m.archetype === "supply_hero") {
    return `${m.name}, dein Einkaufs-Beitrag hält die Runde am Laufen – danke für's Mitdenken.`;
  }
  return `${m.name}, ${m.coffees} Tassen in diesem Zeitraum. Solide.`;
}

// ---------------------------------------------------------------------------
// Haupt-Funktion
// ---------------------------------------------------------------------------

export async function enrichRecapWithClaude(input: RecapInput): Promise<RecapInput> {
  const client = getClient();

  if (!client) {
    // kein API-Key → alle Felder mit Fallbacks füllen, trotzdem ein PDF liefern
    return {
      ...input,
      headline_title: fallbackTitle(input),
      fun_fact: fallbackFunFact(input),
      members: input.members.map((m) => ({
        ...m,
        personal_comment: fallbackMemberComment(m),
      })),
    };
  }

  const groupUserMessage = buildGroupUserMessage(input);

  // Gruppen-Calls parallel
  const [titleResult, funFactResult] = await Promise.allSettled([
    callClaude({
      client,
      system: TITLE_SYSTEM_PROMPT,
      user: groupUserMessage,
      maxTokens: MAX_TOKENS_TITLE,
    }),
    callClaude({
      client,
      system: FUN_FACT_SYSTEM_PROMPT,
      user: groupUserMessage,
      maxTokens: MAX_TOKENS_FUNFACT,
    }),
  ]);

  const headline_title =
    titleResult.status === "fulfilled" && titleResult.value
      ? titleResult.value
      : fallbackTitle(input);
  const fun_fact =
    funFactResult.status === "fulfilled" && funFactResult.value
      ? funFactResult.value
      : fallbackFunFact(input);

  // Persönliche Kommentare – parallel für alle Mitglieder
  const activeDrinkers = input.members.filter((m) => m.coffees > 0);
  const avgCoffees =
    activeDrinkers.length > 0
      ? activeDrinkers.reduce((a, b) => a + b.coffees, 0) / activeDrinkers.length
      : 0;

  const memberResults = await Promise.allSettled(
    input.members.map((m) =>
      callClaude({
        client,
        system: PERSONAL_COMMENT_SYSTEM_PROMPT,
        user: buildMemberUserMessage(
          m,
          avgCoffees,
          input.stats.total_coffees,
          input.period.label_de,
        ),
        maxTokens: MAX_TOKENS_MEMBER,
      }),
    ),
  );

  const enrichedMembers: RecapMember[] = input.members.map((m, i) => {
    const res = memberResults[i];
    const text =
      res.status === "fulfilled" && res.value ? res.value : fallbackMemberComment(m);
    return { ...m, personal_comment: text };
  });

  return {
    ...input,
    headline_title,
    fun_fact,
    members: enrichedMembers,
  };
}

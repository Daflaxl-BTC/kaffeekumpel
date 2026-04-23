/**
 * Dünner Wrapper um die Resend HTTP-API.
 * Kein SDK, damit wir keine weitere Dependency ziehen — Resend hat eine
 * simple REST-Schnittstelle, fetch reicht völlig.
 *
 * Falls RESEND_API_KEY nicht gesetzt ist, geben wir `{ skipped: true }`
 * zurück statt zu werfen — damit läuft Dev ohne Mail-Key problemlos und
 * Magic-Link-Flows melden sauber "Mail nicht konfiguriert".
 */

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendMailResult {
  skipped: boolean;
  id?: string;
  error?: string;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.warn(
      "[mail] skipped: RESEND_API_KEY oder MAIL_FROM nicht gesetzt.",
    );
    return { skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[mail] resend failed",
        res.status,
        body.slice(0, 200),
      );
      return { skipped: false, error: `resend_http_${res.status}` };
    }
    const json = (await res.json()) as { id?: string };
    return { skipped: false, id: json.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[mail] fetch failed:", msg);
    return { skipped: false, error: msg };
  }
}

/**
 * Escaped User-Input für HTML-Einbettung. Resend rendert kein Markdown.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

import { escapeHtml } from "./resend";
import { formatEuro } from "@/lib/utils";

const BRAND = "☕ Kaffeekumpel";
const PRIMARY = "#8B5A2B";

function wrap(title: string, body: string): string {
  return `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f4efe8;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#2E1D10;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe8;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="max-width:520px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(46,29,16,0.08);">
          <tr>
            <td style="background:${PRIMARY};color:#fff;padding:20px 24px;font-size:14px;letter-spacing:0.4px;">
              ${BRAND}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <h1 style="font-size:20px;margin:0 0 16px;color:#2E1D10;">${escapeHtml(title)}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;color:#8a6f5f;font-size:12px;border-top:1px solid #f0e8dc;">
              Du bekommst diese Mail, weil du in einer Kaffeekumpel-Gruppe Mitglied bist.
              Kein Account-System, kein Newsletter — nur funktionale Mails.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function magicLinkEmail(opts: {
  groupName: string;
  memberName: string;
  link: string;
}): { subject: string; html: string; text: string } {
  const subject = `Login-Link für "${opts.groupName}"`;
  const html = wrap(
    `Hey ${escapeHtml(opts.memberName)}, willkommen auf einem neuen Gerät.`,
    `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
        Klick auf den Button, um dich als
        <strong>${escapeHtml(opts.memberName)}</strong> in der Gruppe
        <strong>${escapeHtml(opts.groupName)}</strong> einzuloggen.
      </p>
      <p style="margin:16px 0 24px;">
        <a href="${opts.link}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;">
          Jetzt einloggen
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#574236;">
        Der Link ist 30 Minuten gültig. Wenn du ihn nicht angefordert hast,
        ignorier ihn einfach.
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#8a6f5f;word-break:break-all;">
        Falls der Button nicht geht: <br />
        <span style="font-family:monospace;">${escapeHtml(opts.link)}</span>
      </p>
    `,
  );
  const text = `Hey ${opts.memberName},

Klick auf diesen Link, um dich in "${opts.groupName}" einzuloggen (gültig 30 Minuten):

${opts.link}

Wenn du ihn nicht angefordert hast, einfach ignorieren.

— ☕ Kaffeekumpel`;
  return { subject, html, text };
}

export interface SettlementTransferLine {
  counterparty: string;
  /** Positiv = Mitglied schuldet; Negativ = Mitglied bekommt. */
  amount_cents: number;
  paypalLink?: string;
}

export function settlementEmail(opts: {
  groupName: string;
  memberName: string;
  currency: string;
  coveredFrom: Date;
  coveredTo: Date;
  outgoing: SettlementTransferLine[]; // du zahlst an andere
  incoming: SettlementTransferLine[]; // andere zahlen an dich
  groupUrl: string;
}): { subject: string; html: string; text: string } {
  const fromFmt = opts.coveredFrom.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
  });
  const toFmt = opts.coveredTo.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const subject = `Abrechnung "${opts.groupName}" (${fromFmt}–${toFmt})`;

  const outgoingRows = opts.outgoing
    .map(
      (t) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8dc;">
        an <strong>${escapeHtml(t.counterparty)}</strong>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8dc;text-align:right;">
        ${formatEuro(t.amount_cents, opts.currency)}
      </td>
      <td style="padding:8px 0 8px 8px;border-bottom:1px solid #f0e8dc;text-align:right;">
        ${
          t.paypalLink
            ? `<a href="${t.paypalLink}" style="background:${PRIMARY};color:#fff;text-decoration:none;padding:6px 12px;border-radius:8px;font-size:13px;">PayPal</a>`
            : `<span style="font-size:12px;color:#8a6f5f;">kein PayPal</span>`
        }
      </td>
    </tr>`,
    )
    .join("");

  const incomingRows = opts.incoming
    .map(
      (t) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8dc;">
        von <strong>${escapeHtml(t.counterparty)}</strong>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8dc;text-align:right;">
        ${formatEuro(t.amount_cents, opts.currency)}
      </td>
    </tr>`,
    )
    .join("");

  const outgoingSum = opts.outgoing.reduce((s, t) => s + t.amount_cents, 0);
  const incomingSum = opts.incoming.reduce((s, t) => s + t.amount_cents, 0);

  const body = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
      Hey ${escapeHtml(opts.memberName)}, die Abrechnung für
      <strong>${escapeHtml(opts.groupName)}</strong> ist durch
      (${fromFmt}–${toFmt}).
    </p>

    ${
      opts.outgoing.length === 0 && opts.incoming.length === 0
        ? `<p style="margin:16px 0;padding:12px;background:#ecf7ed;border-radius:8px;color:#2d5a34;">
             Du bist ausgeglichen — nichts zu zahlen, nichts zu bekommen. 👌
           </p>`
        : ""
    }

    ${
      opts.outgoing.length > 0
        ? `
      <h2 style="font-size:15px;margin:24px 0 8px;color:#b34f32;">
        Du schuldest (gesamt ${formatEuro(outgoingSum, opts.currency)}):
      </h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
        ${outgoingRows}
      </table>`
        : ""
    }

    ${
      opts.incoming.length > 0
        ? `
      <h2 style="font-size:15px;margin:24px 0 8px;color:#2d5a34;">
        Du bekommst (gesamt ${formatEuro(incomingSum, opts.currency)}):
      </h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
        ${incomingRows}
      </table>`
        : ""
    }

    <p style="margin:24px 0 0;">
      <a href="${opts.groupUrl}" style="color:${PRIMARY};">
        Zur Gruppe →
      </a>
    </p>
  `;

  const text = [
    `Abrechnung "${opts.groupName}" — ${fromFmt} bis ${toFmt}`,
    "",
    opts.outgoing.length > 0
      ? `Du schuldest:\n${opts.outgoing
          .map(
            (t) =>
              `  • ${t.counterparty}: ${formatEuro(t.amount_cents, opts.currency)}${t.paypalLink ? ` — ${t.paypalLink}` : ""}`,
          )
          .join("\n")}`
      : "",
    opts.incoming.length > 0
      ? `Du bekommst:\n${opts.incoming
          .map(
            (t) =>
              `  • ${t.counterparty}: ${formatEuro(t.amount_cents, opts.currency)}`,
          )
          .join("\n")}`
      : "",
    "",
    `Gruppe ansehen: ${opts.groupUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html: wrap(subject, body), text };
}

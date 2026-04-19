/**
 * HTML-Template für den Recap als PDF (Monat ODER Jahr).
 *
 * Rendering: server-seitig mit Puppeteer-Core + @sparticuz/chromium (Vercel)
 * oder lokalem Chrome (Dev, siehe lib/recap/pdf.ts).
 *
 * Eigenheiten:
 *   - alles inline (kein externes CSS, keine Web-Fonts)
 *   - feste A4-Seiten via @page
 *   - Chart als inline-SVG, kein JS
 *   - Bilder (QR) als data: URLs
 *   - Persönliche Kommentar-Karten pro Mitglied – das ist der Kern der
 *     Feature: jede:r bekommt eine eigene, vollständig von Claude generierte
 *     Zeile zum eigenen Konsum.
 *
 * Jahresrückblick: der Chart verdichtet automatisch auf Monats-Summen,
 * falls daily > 45 Einträge hat.
 */

import type { RecapInput, RecapDailyPoint, RecapMember } from "./types";

const CURRENCY_LOCALE: Record<RecapInput["group"]["currency"], string> = {
  EUR: "de-DE",
  CHF: "de-CH",
  USD: "en-US",
  GBP: "en-GB",
};

function money(cents: number, currency: RecapInput["group"]["currency"]): string {
  return (cents / 100).toLocaleString(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Verdichtet tägliche Datenpunkte auf Monatssummen, falls die Zeitreihe
 * zu lang wird (Jahresrückblick). Sonst 1:1 durchreichen.
 */
function condenseForChart(daily: RecapDailyPoint[]): {
  points: RecapDailyPoint[];
  granularity: "day" | "month";
} {
  if (daily.length <= 45) return { points: daily, granularity: "day" };

  const buckets = new Map<string, number>();
  for (const d of daily) {
    const ym = d.date.slice(0, 7); // "2026-03"
    buckets.set(ym, (buckets.get(ym) ?? 0) + d.coffees);
  }
  const points = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, coffees]) => ({ date: `${ym}-01`, coffees }));
  return { points, granularity: "month" };
}

const MONTH_SHORT_DE = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

function labelForPoint(d: RecapDailyPoint, granularity: "day" | "month"): string {
  if (granularity === "month") {
    const mIdx = parseInt(d.date.slice(5, 7), 10) - 1;
    return MONTH_SHORT_DE[mIdx] ?? "";
  }
  return String(parseInt(d.date.slice(-2), 10));
}

function renderChart(daily: RecapDailyPoint[]): string {
  if (daily.length === 0) {
    return `<div class="chart-empty">Keine Kaffees in diesem Zeitraum.</div>`;
  }
  const { points, granularity } = condenseForChart(daily);

  const width = 680;
  const height = 160;
  const padBottom = 22;
  const padTop = 12;
  const chartH = height - padBottom - padTop;
  const max = Math.max(1, ...points.map((d) => d.coffees));
  const barW = width / points.length;
  const gap = Math.min(3, barW * 0.18);

  const bars = points
    .map((d, i) => {
      const h = (d.coffees / max) * chartH;
      const x = i * barW + gap / 2;
      const y = padTop + (chartH - h);
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barW - gap).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="#8B5A2B" />`;
    })
    .join("");

  // Labels: Tage in 5er-Schritten, Monate immer
  const labels = points
    .map((d, i) => {
      if (granularity === "day") {
        const day = parseInt(d.date.slice(-2), 10);
        if (i !== 0 && i !== points.length - 1 && day % 5 !== 0) return "";
      }
      const x = i * barW + barW / 2;
      return `<text x="${x.toFixed(1)}" y="${height - 6}" text-anchor="middle" font-size="9" fill="#7A4E32">${esc(labelForPoint(d, granularity))}</text>`;
    })
    .join("");

  const peakIdx = points.reduce(
    (best, d, i) => (d.coffees > points[best].coffees ? i : best),
    0,
  );
  const peakX = peakIdx * barW + barW / 2;
  const peak = points[peakIdx];
  const peakLabel = granularity === "month"
    ? `${labelForPoint(peak, "month")} · ${peak.coffees}`
    : `Peak · ${peak.coffees}`;
  const peakMarker = `
    <line x1="${peakX.toFixed(1)}" y1="${padTop}" x2="${peakX.toFixed(1)}" y2="${height - padBottom}" stroke="#3D6B3A" stroke-dasharray="2 2" stroke-width="1" />
    <text x="${peakX.toFixed(1)}" y="${padTop - 2}" text-anchor="middle" font-size="9" fill="#3D6B3A" font-weight="600">${esc(peakLabel)}</text>
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}"
         xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaffees pro ${granularity === "month" ? "Monat" : "Tag"}">
      ${bars}
      ${peakMarker}
      ${labels}
    </svg>
  `;
}

function renderTransferRow(
  t: RecapInput["transfers"][number],
  idx: number,
  currency: RecapInput["group"]["currency"],
): string {
  const arrow = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A4E32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>
    </svg>`;
  const paypalBadge = t.paypal_url
    ? `<a href="${esc(t.paypal_url)}" class="pay-link">PayPal</a>`
    : `<span class="pay-link muted">offen</span>`;
  return `
    <tr class="${idx % 2 === 0 ? "" : "alt"}">
      <td class="who">
        <span class="avatar avatar-red">${esc(t.from_name.slice(0, 1).toUpperCase())}</span>
        <span>${esc(t.from_name)}</span>
      </td>
      <td class="arrow">${arrow}</td>
      <td class="who">
        <span class="avatar avatar-green">${esc(t.to_name.slice(0, 1).toUpperCase())}</span>
        <span>${esc(t.to_name)}</span>
      </td>
      <td class="amount">${money(t.amount_cents, currency)}</td>
      <td class="pay">${paypalBadge}</td>
    </tr>
  `;
}

const ARCHETYPE_LABEL: Record<RecapMember["archetype"], string> = {
  heavy: "Dauerläufer",
  steady: "Stammkraft",
  light: "Gelegenheits-Trinker",
  ghost: "Rand-Erscheinung",
  abstinent: "Abstinent",
  supply_hero: "Versorgungs-Held:in",
  new: "Neuzugang",
};

function renderMemberCard(
  m: RecapMember,
  currency: RecapInput["group"]["currency"],
): string {
  const comment = m.personal_comment?.trim() || "—";
  return `
    <div class="member-card">
      <div class="member-head">
        <span class="avatar avatar-brown">${esc(m.avatar_initial)}</span>
        <div class="member-name">
          <div class="mname">${esc(m.name)}</div>
          <div class="mtag">${esc(ARCHETYPE_LABEL[m.archetype])}</div>
        </div>
        <div class="member-numbers">
          <div class="mn-big">${m.coffees}</div>
          <div class="mn-label">Tassen</div>
        </div>
        <div class="member-numbers">
          <div class="mn-big">${money(m.spend_cents, currency)}</div>
          <div class="mn-label">beigesteuert</div>
        </div>
      </div>
      <div class="member-comment">${esc(comment)}</div>
    </div>
  `;
}

export function renderRecapHtml(input: RecapInput): string {
  const {
    group,
    period,
    stats,
    members,
    transfers,
    daily,
    headline_title,
    fun_fact,
    qr_data_url,
    group_url,
  } = input;

  const top = stats.top_drinker;
  const topBuyer = stats.top_buyer;

  const settlementBody =
    transfers.length > 0
      ? transfers.map((t, i) => renderTransferRow(t, i, group.currency)).join("")
      : `<tr><td colspan="5" class="empty">Alle sind ausgeglichen. ☕</td></tr>`;

  const memberCards = members.length
    ? members
        .slice()
        .sort((a, b) => b.coffees - a.coffees || b.spend_cents - a.spend_cents)
        .map((m) => renderMemberCard(m, group.currency))
        .join("")
    : `<div class="empty">Keine Mitglieder gefunden.</div>`;

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Kaffeekumpel · ${esc(group.name)} · ${esc(period.label_de)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #2E1D10;
    background: #FAF6F1;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 14mm 14mm;
    background: #FAF6F1;
    position: relative;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* --- Header --- */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 8mm;
    border-bottom: 1px solid #E8D5B8;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo {
    width: 38px; height: 38px; border-radius: 12px;
    background: #5B3A1E; color: #FAF6F1;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 20px;
  }
  .brand-name { font-weight: 600; font-size: 14px; color: #5B3A1E; letter-spacing: .2px; }
  .brand-sub  { font-size: 11px; color: #7A4E32; }
  .head-right { text-align: right; }
  .group-name { font-size: 13px; font-weight: 600; color: #3A2618; }
  .month-label { font-size: 11px; color: #7A4E32; text-transform: uppercase; letter-spacing: 1px; }

  /* --- Headline --- */
  .headline {
    margin: 7mm 0 2mm;
    font-size: 30px; line-height: 1.15;
    font-weight: 700; color: #2E1D10;
    letter-spacing: -0.4px;
  }
  .headline-sub {
    font-size: 13px; color: #5B3A1E;
    margin-bottom: 7mm;
  }

  /* --- KPI-Cards --- */
  .kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4mm;
    margin-bottom: 7mm;
  }
  .kpi {
    background: #fff;
    border: 1px solid #E8D5B8;
    border-radius: 10px;
    padding: 4mm;
  }
  .kpi-label {
    font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.8px; color: #7A4E32;
    margin-bottom: 2mm;
  }
  .kpi-value { font-size: 22px; font-weight: 700; color: #2E1D10; line-height: 1.1; }
  .kpi-sub   { font-size: 11px; color: #5B3A1E; margin-top: 2mm; }
  .kpi.accent { background: #5B3A1E; border-color: #5B3A1E; }
  .kpi.accent .kpi-label { color: #E8D5B8; }
  .kpi.accent .kpi-value { color: #FAF6F1; }
  .kpi.accent .kpi-sub   { color: #F1E7D8; }

  /* --- Chart --- */
  .section-title {
    font-size: 11px; text-transform: uppercase; letter-spacing: 1.1px;
    color: #7A4E32; font-weight: 600;
    margin: 0 0 3mm;
  }
  .chart {
    background: #fff;
    border: 1px solid #E8D5B8;
    border-radius: 10px;
    padding: 4mm 4mm 2mm;
    margin-bottom: 7mm;
  }
  .chart-empty { font-size: 12px; color: #7A4E32; padding: 6mm 0; text-align: center; }

  /* --- Settlement --- */
  .settlement {
    background: #fff;
    border: 1px solid #E8D5B8;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 7mm;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.8px; color: #7A4E32;
    padding: 3mm 4mm; background: #F1E7D8; font-weight: 600;
  }
  td { padding: 3mm 4mm; font-size: 12px; vertical-align: middle; }
  tr.alt td { background: #FAF6F1; }
  td.who { display: flex; align-items: center; gap: 8px; }
  td.arrow { width: 20px; text-align: center; }
  td.amount { font-weight: 700; font-variant-numeric: tabular-nums; }
  td.pay { text-align: right; }
  td.empty, .empty { text-align: center; color: #7A4E32; font-style: italic; padding: 6mm; }
  .avatar {
    width: 22px; height: 22px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: #FAF6F1;
    flex: 0 0 auto;
  }
  .avatar-red   { background: #8B5A2B; }
  .avatar-green { background: #3D6B3A; }
  .avatar-brown { background: #5B3A1E; width: 28px; height: 28px; font-size: 13px; }
  .pay-link {
    font-size: 10px; padding: 2px 8px; border-radius: 999px;
    background: #5B3A1E; color: #FAF6F1; text-decoration: none;
  }
  .pay-link.muted { background: #E8D5B8; color: #7A4E32; }

  /* --- Fun Fact --- */
  .fun {
    background: #3D6B3A;
    color: #FAF6F1;
    border-radius: 10px;
    padding: 5mm 6mm;
    font-size: 13px; line-height: 1.45;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 7mm;
  }
  .fun-icon {
    width: 28px; height: 28px; border-radius: 50%;
    background: #2D4A2B; display: flex; align-items: center;
    justify-content: center; flex: 0 0 auto; font-size: 16px;
  }

  /* --- Personal Cards (Seite 2) --- */
  .personal-intro {
    margin: 6mm 0 5mm;
    font-size: 13px; color: #5B3A1E;
    line-height: 1.5;
  }
  .member-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4mm;
  }
  .member-card {
    background: #fff;
    border: 1px solid #E8D5B8;
    border-radius: 10px;
    padding: 4mm 5mm;
    break-inside: avoid;
  }
  .member-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 3mm;
  }
  .member-name { flex: 1 1 auto; min-width: 0; }
  .mname { font-weight: 600; font-size: 13px; color: #2E1D10; }
  .mtag {
    font-size: 10px; color: #7A4E32; text-transform: uppercase;
    letter-spacing: 0.6px; margin-top: 1mm;
  }
  .member-numbers {
    text-align: right; flex: 0 0 auto; padding-left: 6mm;
    border-left: 1px solid #E8D5B8;
  }
  .mn-big { font-size: 16px; font-weight: 700; color: #2E1D10; line-height: 1; font-variant-numeric: tabular-nums; }
  .mn-label { font-size: 10px; color: #7A4E32; margin-top: 1mm; text-transform: uppercase; letter-spacing: 0.6px; }
  .member-comment {
    font-size: 12.5px; color: #3A2618; line-height: 1.55;
    background: #FAF6F1; border-radius: 6px; padding: 3mm 4mm;
  }

  /* --- Footer --- */
  .footer {
    position: absolute;
    left: 14mm; right: 14mm; bottom: 10mm;
    display: flex; justify-content: space-between; align-items: flex-end;
    padding-top: 6mm; border-top: 1px solid #E8D5B8;
  }
  .foot-text { font-size: 10px; color: #7A4E32; max-width: 120mm; line-height: 1.5; }
  .foot-text .cta { color: #5B3A1E; font-weight: 600; }
  .foot-url { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; color: #5B3A1E; }
  .qr {
    width: 28mm; height: 28mm; padding: 2mm; background: #fff;
    border: 1px solid #E8D5B8; border-radius: 8px;
  }
  .qr img { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
  <!-- Seite 1: Gruppen-Überblick -->
  <div class="page">
    <header class="header">
      <div class="brand">
        <div class="logo">K</div>
        <div>
          <div class="brand-name">Kaffeekumpel</div>
          <div class="brand-sub">${period.type === "year" ? "Jahresrückblick" : "Monatsrückblick"}</div>
        </div>
      </div>
      <div class="head-right">
        <div class="group-name">${esc(group.name)}</div>
        <div class="month-label">${esc(period.label_de)}</div>
      </div>
    </header>

    <h1 class="headline">${esc(headline_title)}</h1>
    <div class="headline-sub">Hier ist, was ${period.type === "year" ? "dieses Jahr" : "diesen Monat"} an eurer Maschine passiert ist.</div>

    <section class="kpis">
      <div class="kpi accent">
        <div class="kpi-label">Tassen insgesamt</div>
        <div class="kpi-value">${stats.total_coffees}</div>
        <div class="kpi-sub">${group.coffee_price_cents > 0 ? `à ${money(group.coffee_price_cents, group.currency)}` : "—"}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Ausgaben gesamt</div>
        <div class="kpi-value">${money(stats.total_spend_cents, group.currency)}</div>
        <div class="kpi-sub">Bohnen, Milch, Filter …</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">⌀ pro Tasse</div>
        <div class="kpi-value">${money(stats.avg_price_cents, group.currency)}</div>
        <div class="kpi-sub">aus echten Einkäufen</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Top-Trinker</div>
        <div class="kpi-value">${top ? esc(top.name) : "—"}</div>
        <div class="kpi-sub">${top ? `${top.coffees} Tassen` : "niemand"}${
          topBuyer
            ? ` · Einkaufs-König: <strong>${esc(topBuyer.name)}</strong> (${money(topBuyer.spend_cents, group.currency)})`
            : ""
        }</div>
      </div>
    </section>

    <h2 class="section-title">Kaffees pro ${daily.length > 45 ? "Monat" : "Tag"}</h2>
    <div class="chart">${renderChart(daily)}</div>

    <h2 class="section-title">Wer schuldet wem</h2>
    <div class="settlement">
      <table>
        <thead>
          <tr>
            <th>Von</th>
            <th></th>
            <th>An</th>
            <th>Betrag</th>
            <th style="text-align:right">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          ${settlementBody}
        </tbody>
      </table>
    </div>

    <div class="fun">
      <div class="fun-icon">☕</div>
      <div>${esc(fun_fact)}</div>
    </div>

    <footer class="footer">
      <div class="foot-text">
        <div class="cta">Neu in der Runde? Scannt den QR-Code und seid sofort dabei.</div>
        <div class="foot-url">${esc(group_url)}</div>
      </div>
      <div class="qr">
        <img src="${qr_data_url}" alt="QR-Code zur Gruppe ${esc(group.name)}" />
      </div>
    </footer>
  </div>

  <!-- Seite 2: Persönlich für jedes Mitglied -->
  <div class="page">
    <header class="header">
      <div class="brand">
        <div class="logo">K</div>
        <div>
          <div class="brand-name">Kaffeekumpel</div>
          <div class="brand-sub">Persönlicher Teil</div>
        </div>
      </div>
      <div class="head-right">
        <div class="group-name">${esc(group.name)}</div>
        <div class="month-label">${esc(period.label_de)}</div>
      </div>
    </header>

    <h1 class="headline">Und jetzt mal zu euch.</h1>
    <div class="personal-intro">
      Jede:r kriegt einen eigenen Kommentar, basierend auf dem,
      was die Maschine über ${period.type === "year" ? "das Jahr" : "den Monat"} von euch gesehen hat.
      Keine Wertung, nur Zahlen mit etwas Augenzwinkern.
    </div>

    <div class="member-grid">
      ${memberCards}
    </div>

    <footer class="footer">
      <div class="foot-text">
        <div class="cta">Generiert mit Kaffeekumpel · ohne Account, mit Stil.</div>
        <div class="foot-url">${esc(group_url)}</div>
      </div>
      <div class="qr">
        <img src="${qr_data_url}" alt="QR-Code zur Gruppe ${esc(group.name)}" />
      </div>
    </footer>
  </div>
</body>
</html>`;
}

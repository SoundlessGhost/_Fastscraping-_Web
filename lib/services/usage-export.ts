import ExcelJS from "exceljs";
import type { NormalizedUsage } from "@/lib/services/usage";
import { regionName } from "@/lib/regions";

// Builds the client-facing usage workbook. Kept out of the route so the sheet
// layout can be exercised on its own, without auth or a live backend.
//
// One sheet, two blocks of content: the summary (and region split) reads down
// the left, the day-by-day table sits beside it on the right — so nothing gets
// pushed dozens of rows down. No fills or coloured text; hierarchy comes from
// weight, rules and alignment only. Otherwise it's an ordinary Excel sheet:
// gridlines and row/column headings on, nothing frozen.

const NUM = "#,##0";
const PCT = "0.0%";

// Left block: labels | values | share. Then a spacer, then the daily table.
const COL_LABEL = 1;
const COL_VALUE = 2;
const COL_SHARE = 3;
const DSTART = 5;
/// Both blocks start on the first row — there is no title band above them.
const HEAD_ROW = 1;

/// Every YYYY-MM-DD from start to end inclusive (UTC). Mirrors the same helper
/// in ServiceUsage so the sheet covers precisely the days the chart drew.
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export type WorkbookInput = {
  serviceName: string;
  accountEmail: string;
  from: string;
  to: string;
  usage: NormalizedUsage;
};

/// Returns an ArrayBuffer-backed view specifically: a plain `Uint8Array` widens
/// to ArrayBufferLike, which isn't accepted as a response body.
export async function buildUsageWorkbook(
  input: WorkbookInput,
): Promise<Uint8Array<ArrayBuffer>> {
  const { accountEmail, from, to, usage } = input;

  const rows = datesBetween(from, to).map((date) => {
    const e = usage.byDate[date];
    return { date, total: e?.total ?? 0, by: e?.by ?? {} };
  });

  // Only regions with traffic inside this window get a column.
  const dims: string[] = [];
  for (const r of rows) for (const k of Object.keys(r.by)) if (!dims.includes(k)) dims.push(k);

  const rangeTotal = rows.reduce((s, r) => s + r.total, 0);
  const colTotal = (d: string) => rows.reduce((s, r) => s + (r.by[d] ?? 0), 0);
  // Biggest first — the useful reading order for a share table.
  const ranked = [...dims].sort((a, b) => colTotal(b) - colTotal(a));

  const wb = new ExcelJS.Workbook();
  wb.creator = "Fastscraping";
  wb.created = new Date();

  // A plain Excel sheet: gridlines and the A/B/C · 1/2/3 headings stay on, so
  // columns are readable. We only fill in content — no view overrides.
  const ws = wb.addWorksheet("Usage");
  // Declares the columns; the widths here are only placeholders — every one is
  // recomputed from its actual content at the end of this function.
  ws.columns = [
    {}, // labels / region names
    {}, // values
    {}, // share
    {}, // spacer
    {}, // date
    {}, // total
    ...dims.map(() => ({})),
  ];

  // ---- left block: summary -------------------------------------------------
  const rule = (row: ExcelJS.Row, from_: number, to_: number, edge: "top" | "bottom") => {
    for (let i = from_; i <= to_; i++) {
      row.getCell(i).border = { [edge]: { style: "thin" } };
    }
  };

  const section = (label: string) => {
    const row = ws.addRow([label]);
    row.height = 20;
    row.getCell(COL_LABEL).font = { bold: true, size: 11 };
    row.getCell(COL_LABEL).alignment = { vertical: "middle" };
    rule(row, COL_LABEL, COL_SHARE, "bottom");
  };

  const kv = (k: string, v: string | number, fmt = NUM) => {
    const row = ws.addRow([k, v]);
    row.height = 16;
    row.getCell(COL_LABEL).font = { size: 11 };
    const b = row.getCell(COL_VALUE);
    b.font = { size: 11, bold: true };
    b.alignment = { horizontal: "right" };
    if (typeof v === "number") b.numFmt = fmt;
  };

  section("Account");
  kv("Account", accountEmail);
  if (usage.owner) kv("Service owner", usage.owner);
  kv("Date range (UTC)", `${from} to ${to}`);
  kv("Generated (UTC)", new Date().toISOString().replace("T", " ").slice(0, 19));
  ws.addRow([]);

  section("Requests");
  kv("Total requests", rangeTotal);
  kv("Daily average", rows.length ? Math.round(rangeTotal / rows.length) : 0);
  if (rows.length) {
    kv("Busiest day", rows.reduce((a, b) => (b.total > a.total ? b : a), rows[0]!).date);
  }
  ws.addRow([]);

  // Credits / jobs / limits / pricing are only reported by some backends — omit
  // the whole section rather than print a confident zero for something unmeasured.
  const c = usage.credits;
  if (c) {
    section("Credits");
    kv("Plan", c.unlimited ? "Unlimited" : c.total === null ? "—" : c.total);
    if (c.used !== null) kv("Used", c.used);
    if (!c.unlimited && c.remaining !== null) kv("Remaining", c.remaining);
    ws.addRow([]);
  }

  const j = usage.jobs;
  if (j) {
    section("Job health (lifetime)");
    kv("Total jobs", j.total);
    // Mirrors the dashboard's labelling: "completed" is what actually gets charged.
    kv("Completed (billable)", j.billable ?? j.completed);
    kv("Success", j.completed);
    if (j.notFound !== null) kv("Not found", j.notFound);
    kv("Failed", j.failed);
    ws.addRow([]);
  }

  const price = usage.pricing;
  if (price) {
    const billed = usage.credits?.used ?? usage.totals.lifetime;
    const code = /^[A-Z]{3}$/.test(price.currency) ? price.currency : "USD";
    const money = `"${code === "USD" ? "$" : code + " "}"#,##0.00`;
    section("Estimated cost");
    kv("Rate (per 1,000)", price.per1000, money);
    kv("Billed requests", billed);
    kv("Estimated cost", (billed / 1000) * price.per1000, money);
    ws.addRow([]);
  }

  const l = usage.limits;
  if (l && (l.perMinute ?? l.perHour ?? l.perDay ?? l.concurrency) !== null) {
    section("Rate limits");
    if (l.perMinute !== null) kv("Per minute", l.perMinute);
    if (l.perHour !== null) kv("Per hour", l.perHour);
    if (l.perDay !== null) kv("Per day", l.perDay);
    if (l.concurrency !== null) kv("Concurrency", l.concurrency);
    ws.addRow([]);
  }

  if (ranked.length > 0) {
    section("By region");
    const head = ws.addRow(["Region", "Requests", "Share"]);
    head.height = 17;
    for (const ci of [COL_LABEL, COL_VALUE, COL_SHARE]) {
      head.getCell(ci).font = { bold: true, size: 11 };
      head.getCell(ci).alignment = { horizontal: ci === COL_LABEL ? "left" : "right" };
    }

    for (const d of ranked) {
      const n = colTotal(d);
      const row = ws.addRow([regionName(d), n, rangeTotal ? n / rangeTotal : 0]);
      row.height = 16;
      row.getCell(COL_VALUE).alignment = { horizontal: "right" };
      row.getCell(COL_VALUE).numFmt = NUM;
      row.getCell(COL_SHARE).alignment = { horizontal: "right" };
      row.getCell(COL_SHARE).numFmt = PCT;
    }

    const rt = ws.addRow(["Total", rangeTotal, 1]);
    rt.height = 17;
    for (const ci of [COL_LABEL, COL_VALUE, COL_SHARE]) {
      rt.getCell(ci).font = { bold: true, size: 11 };
      rt.getCell(ci).alignment = { horizontal: ci === COL_LABEL ? "left" : "right" };
    }
    rt.getCell(COL_VALUE).numFmt = NUM;
    rt.getCell(COL_SHARE).numFmt = PCT;
    rule(rt, COL_LABEL, COL_SHARE, "top");
  }

  // ---- right block: the daily table, starting level with the summary -------
  const headRow = ws.getRow(HEAD_ROW);
  headRow.height = 20;
  ["Date (UTC)", "Total", ...dims.map(regionName)].forEach((label, i) => {
    const cell = headRow.getCell(DSTART + i);
    cell.value = label;
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: i === 0 ? "left" : "right", vertical: "middle" };
    cell.border = { bottom: { style: "thin" } };
  });

  rows.forEach((r, i) => {
    const row = ws.getRow(HEAD_ROW + 1 + i);
    if (!row.height) row.height = 16;
    [r.date, r.total, ...dims.map((d) => r.by[d] ?? 0)].forEach((v, ci) => {
      const cell = row.getCell(DSTART + ci);
      cell.value = v;
      cell.font = { size: 11 };
      cell.alignment = { horizontal: ci === 0 ? "left" : "right" };
      if (ci > 0) cell.numFmt = NUM;
    });
  });

  const totalRow = ws.getRow(HEAD_ROW + 1 + rows.length);
  if (!totalRow.height) totalRow.height = 17;
  ["Total", rangeTotal, ...dims.map(colTotal)].forEach((v, ci) => {
    const cell = totalRow.getCell(DSTART + ci);
    cell.value = v;
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: ci === 0 ? "left" : "right" };
    if (ci > 0) cell.numFmt = NUM;
    cell.border = { top: { style: "thin" } };
  });

  // ---- size every column to its widest cell --------------------------------
  // Excel doesn't auto-fit on open, so a long value (an email, a timestamp)
  // sits clipped until you double-click the column edge. Measure what will
  // actually be rendered — a number shows as its *formatted* text, so 598332
  // needs room for "598,332" and a rate for "$5.00".
  const shownWidth = (cell: ExcelJS.Cell): number => {
    const v = cell.value;
    if (v === null || v === undefined) return 0;

    let text: string;
    if (typeof v === "number") {
      const fmt = cell.numFmt ?? "";
      if (fmt.includes("%")) {
        text = `${(v * 100).toFixed(1)}%`;
      } else {
        const decimals = fmt.includes(".00") ? 2 : 0;
        text = v.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        if (fmt.includes("$")) text = `$${text}`;
      }
    } else {
      text = String(v);
    }

    // Bold runs a little wider than regular at the same size.
    return cell.font?.bold ? text.length * 1.08 : text.length;
  };

  const SPACER_COL = DSTART - 1;
  for (let colNum = 1; colNum <= ws.columnCount; colNum++) {
    if (colNum === SPACER_COL) {
      ws.getColumn(colNum).width = 3; // deliberate gap between the two blocks
      continue;
    }
    let widest = 0;
    ws.eachRow((row) => {
      const w = shownWidth(row.getCell(colNum));
      if (w > widest) widest = w;
    });
    // +2 for cell padding; floor keeps empty columns from collapsing, cap stops
    // one stray long string from pushing everything off-screen.
    ws.getColumn(colNum).width = Math.min(46, Math.max(11, Math.ceil(widest) + 2));
  }

  // writeBuffer hands back a view over ArrayBufferLike, which isn't a valid
  // response BodyInit; copy into a plain ArrayBuffer-backed view (same reason
  // the avatar route does this).
  const written = Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
  const bytes = new Uint8Array(written.byteLength);
  bytes.set(written);
  return bytes;
}

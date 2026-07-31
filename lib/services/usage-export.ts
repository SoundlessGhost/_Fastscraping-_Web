import ExcelJS from "exceljs";
import { regionName } from "@/lib/regions";
import type { NormalizedUsage } from "@/lib/services/usage";

// The client-facing usage export: one plain sheet, three columns — the day, how
// many requests it took, and what that costs. Nothing else. Kept out of the
// route so the layout can be exercised without auth or a live backend.
//
// Cost is only shown when the backend reports a rate; otherwise the column is
// dropped entirely rather than printing a confident $0.

const NUM = "#,##0";
const MONEY = '"$"#,##0.00';

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
  /// Which market these figures cover, or null for all of them. Named in the
  /// sheet as well as the filename — a file that has been renamed, mailed on or
  /// opened months later still has to say which market it counts.
  region?: string | null;
  usage: NormalizedUsage;
};

/// Returns an ArrayBuffer-backed view specifically: a plain `Uint8Array` widens
/// to ArrayBufferLike, which isn't accepted as a response body.
export async function buildUsageWorkbook(
  input: WorkbookInput,
): Promise<Uint8Array<ArrayBuffer>> {
  const { serviceName, accountEmail, from, to, region = null, usage } = input;

  const rows = datesBetween(from, to).map((date) => ({
    date,
    total: usage.byDate[date]?.total ?? 0,
  }));
  const totalRequests = rows.reduce((s, r) => s + r.total, 0);

  const rate = usage.pricing?.per1000 ?? null;
  const cols = rate === null ? 2 : 3;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Fastscraping";
  wb.created = new Date();

  // Ordinary Excel sheet — gridlines and row/column headings left on.
  const ws = wb.addWorksheet("Usage");

  // Says what this file actually is, so it still makes sense months later or in
  // someone else's inbox: which service, whose account, and over what window.
  const title = ws.addRow([
    `${serviceName} — usage${region ? ` — ${regionName(region)}` : ""}`,
  ]);
  title.font = { bold: true, size: 14 };
  title.height = 22;
  const sub = ws.addRow([
    `${from} to ${to} (UTC) · ${rows.length} day${rows.length === 1 ? "" : "s"} · ${accountEmail}` +
      // Spelled out both ways round so neither file can be mistaken for the other.
      (region ? ` · ${regionName(region)} only` : usage.regions ? " · all regions" : ""),
  ]);
  sub.font = { size: 10, italic: true };
  sub.height = 16;
  ws.addRow([]);

  const header = ws.addRow(rate === null ? ["Date (UTC)", "Request"] : ["Date (UTC)", "Request", "Cost"]);
  header.height = 18;
  for (let c = 1; c <= cols; c++) {
    const cell = header.getCell(c);
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: c === 1 ? "left" : "right" };
    cell.border = { bottom: { style: "thin" } };
  }

  // Money in whole cents, computed as requests × rate ÷ 10 so it never picks up
  // a float artifact (55,745 × $5 lands exactly on $278.725, and must round the
  // same way every time). Each day is rounded to the cent it will be billed at.
  const costOf = (requests: number) => Math.round((requests * (rate ?? 0)) / 10) / 100;


  for (const r of rows) {
    const cost = costOf(r.total);

    const row = ws.addRow(rate === null ? [r.date, r.total] : [r.date, r.total, cost]);
    row.height = 16;
    row.getCell(1).font = { size: 11 };
    row.getCell(2).font = { size: 11 };
    row.getCell(2).alignment = { horizontal: "right" };
    row.getCell(2).numFmt = NUM;
    if (rate !== null) {
      row.getCell(3).font = { size: 11 };
      row.getCell(3).alignment = { horizontal: "right" };
      row.getCell(3).numFmt = MONEY;
    }
  }

  // The real charge: the same rate applied to the request total, i.e. exactly
  // what you get checking the sheet by hand. Summing the per-day column instead
  // can land a cent or two off, because each day is rounded to whole cents.
  const totalRow = ws.addRow(
    rate === null ? ["Total", totalRequests] : ["Total", totalRequests, costOf(totalRequests)],
  );
  totalRow.height = 18;
  for (let c = 1; c <= cols; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: c === 1 ? "left" : "right" };
    cell.border = { top: { style: "thin" } };
  }
  totalRow.getCell(2).numFmt = NUM;
  if (rate !== null) totalRow.getCell(3).numFmt = MONEY;

  // Excel doesn't auto-fit on open, so size each column to its widest rendered
  // value — a number shows as its formatted text ("399,892", "$1,999.46").
  // Skips the title block: those are long sentences in column A and would
  // stretch the date column to their length.
  const widths = [12, 10, 10];
  ws.eachRow((row, rowNum) => {
    if (rowNum <= 3) return;
    for (let c = 1; c <= cols; c++) {
      const v = row.getCell(c).value;
      if (v === null || v === undefined) continue;
      const fmt = row.getCell(c).numFmt ?? "";
      const text =
        typeof v === "number"
          ? (fmt.includes("$") ? "$" : "") +
            v.toLocaleString("en-US", {
              minimumFractionDigits: fmt.includes(".00") ? 2 : 0,
              maximumFractionDigits: fmt.includes(".00") ? 2 : 0,
            })
          : String(v);
      const w = row.getCell(c).font?.bold ? text.length * 1.08 : text.length;
      if (w > widths[c - 1]!) widths[c - 1] = w;
    }
  });
  for (let c = 1; c <= cols; c++) ws.getColumn(c).width = Math.ceil(widths[c - 1]!) + 2;

  // writeBuffer hands back a view over ArrayBufferLike, which isn't a valid
  // response BodyInit; copy into a plain ArrayBuffer-backed view (same reason
  // the avatar route does this).
  const written = Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer);
  const bytes = new Uint8Array(written.byteLength);
  bytes.set(written);
  return bytes;
}

import "server-only";

/**
 * Minimal RFC4180-ish CSV parser for the admin bulk-import feature
 * (src/app/actions/admin-import.ts). Handles quoted fields (embedded
 * commas/newlines/escaped "" quotes) and strips a leading UTF-8 BOM, which
 * Excel adds by default when exporting "CSV UTF-8" — without stripping it,
 * the first column header would silently fail to match (e.g. "Full Name"
 * would come through as "﻿Full Name").
 *
 * Returns one object per data row, keyed by the header row's cell text.
 * Blank rows (all cells empty) are skipped.
 */
export function parseCsv(text: string): Record<string, string>[] {
  // Strip a leading UTF-8 BOM via its char code (0xFEFF) rather than a
  // literal BOM character in the source, so this file stays copy/paste-safe
  // in plain-text editors that may mangle invisible characters.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = parseRows(clean);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

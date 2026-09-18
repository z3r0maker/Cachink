import 'server-only';

import type ExcelJS from 'exceljs';

/**
 * A one-sheet workbook from rows the portal already knows how to read.
 *
 * Deliberately **not** `@xangarro/ui`'s `buildExcelWorkbook`. That one turns an
 * `ExportDataset` — the whole business, ten repositories deep — into a
 * ten-sheet book, and it is the right tool for the Settings-level "export all
 * data" in CLAUDE.md §1. The portal's per-screen Exportar is a different
 * question: "give me what I am looking at". Reusing the big one would mean
 * loading nine datasets to export one.
 *
 * The `ExcelJS` import is dynamic for the same reason it is there: the package
 * is CommonJS, and the namespace lands under `.default` under some bundlers
 * and at the top level under others.
 */
export interface Column<T> {
  readonly header: string;
  readonly value: (row: T) => string | number | Date | null;
  readonly width?: number;
}

export async function loadExcelJs(): Promise<typeof ExcelJS> {
  const mod = await import('exceljs');
  const candidate = (mod as unknown as { default?: typeof ExcelJS }).default ?? mod;
  return candidate as typeof ExcelJS;
}

/** Money is integer centavos everywhere; pesos exist only in the cell. */
export const centavosToPesos = (centavos: bigint | number | null): number =>
  centavos === null ? 0 : Number(centavos) / 100;

export async function buildSheet<T>(
  sheetName: string,
  columns: readonly Column<T>[],
  rows: readonly T[],
  exportedAt: Date = new Date(),
): Promise<ArrayBuffer> {
  const ExcelJsNs = await loadExcelJs();
  const wb = new ExcelJsNs.Workbook();
  wb.creator = 'Xangarro';
  wb.created = exportedAt;
  wb.modified = exportedAt;

  const sheet = wb.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, width: c.width ?? 18 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(columns.map((c) => c.value(row)));

  return wb.xlsx.writeBuffer();
}

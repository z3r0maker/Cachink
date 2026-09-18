import 'server-only';

import { loadExcelJs } from '../export/workbook';

/**
 * The first worksheet of an uploaded .xlsx as plain rows of plain values (P-07).
 *
 * ExcelJS hands back rich text, formulas and hyperlinks as objects; the parser
 * wants what the cell *shows*. Numbers stay numbers — `pesosToCentavos` reads
 * `9.8` exactly — and anything else becomes its text.
 */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export class SheetError extends Error {
  readonly code = 'SHEET_INVALID' as const;
}

function plain(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const v = value as { result?: unknown; text?: unknown; richText?: { text: string }[] };
  if (v.richText !== undefined) return v.richText.map((t) => t.text).join('');
  if (v.result !== undefined) return plain(v.result);
  return v.text ?? '';
}

export async function readSheet(file: File): Promise<unknown[][]> {
  if (file.size === 0) throw new SheetError('El archivo está vacío.');
  if (file.size > MAX_IMPORT_BYTES) throw new SheetError('El archivo pesa más de 2 MB.');
  const ExcelJs = await loadExcelJs();
  const wb = new ExcelJs.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new SheetError('No pudimos leer el archivo. Usa la plantilla en formato .xlsx.');
  }
  const sheet = wb.worksheets[0];
  if (sheet === undefined) throw new SheetError('El archivo no tiene hojas.');
  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows.push(values.map(plain));
  });
  return rows;
}

import { isValidRfc, normalizeRfc } from '@xangarro/domain';

import { MAX_IMPORT_ROWS } from './import-productos';

/**
 * The Clientes import (N-16), pure like `import-productos`: a sheet in, typed
 * rows out; every rule lives here where it is tested. Columns: nombre
 * (required), telefono and rfc optional.
 *
 * In-file duplicates follow the matching rule the planner uses against the
 * database: same telefono (by digits) wins; without one, the strictly
 * normalised nombre does. Two rows the planner cannot tell apart are an error
 * on both rows, decided here before any database read.
 */
export const TEMPLATE_HEADERS = ['nombre', 'telefono', 'rfc'] as const;
type Header = (typeof TEMPLATE_HEADERS)[number];
const REQUIRED: readonly Header[] = ['nombre'];

/** The domain's own telefono rule (`ClientSchema`), kept in one place. */
export const TELEFONO_RE = /^[\d\s+\-()]{7,20}$/;

export interface ImportedClient {
  readonly nombre: string;
  readonly telefono: string | null;
  readonly rfc: string | null;
}

export interface ParsedClientRow {
  /** The spreadsheet row number the shopkeeper sees (header is row 1). */
  readonly line: number;
  readonly values: ImportedClient | null;
  readonly errors: readonly string[];
}

export type ParseClientResult =
  | { readonly ok: true; readonly rows: readonly ParsedClientRow[] }
  | { readonly ok: false; readonly message: string };

/** Comparison key: digits only, so «55 1234-5678» is «5512345678». */
export const telefonoKey = (t: string): string => t.replace(/\D/g, '');

/**
 * Comparison key: case-, accent- and whitespace-insensitive nombre. Ñ is a
 * letter, not an accent: it is shielded from the NFD strip so «peña» never
 * matches «pena».
 */
export const nombreKey = (n: string): string =>
  n
    .replace(/ñ/g, '\u0001')
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\u0001/g, 'ñ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const text = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());

function parseRow(cells: Readonly<Record<Header, string>>, line: number): ParsedClientRow {
  const errors: string[] = [];
  const nombre = cells.nombre;
  if (nombre === '') errors.push('nombre vacío');
  if (nombre.length > 120) errors.push('nombre de más de 120 caracteres');

  const telefono = cells.telefono === '' ? null : cells.telefono;
  if (telefono !== null && !TELEFONO_RE.test(telefono)) {
    errors.push(`telefono «${cells.telefono}» no es un teléfono`);
  }

  const rfc = cells.rfc === '' ? null : normalizeRfc(cells.rfc);
  if (rfc !== null && !isValidRfc(rfc)) errors.push(`rfc «${cells.rfc}» no es un RFC válido`);

  const values = errors.length === 0 ? { nombre, telefono: telefono as string | null, rfc } : null;
  return { line, errors, values };
}

/** Rows the planner could not tell apart (owner decision 2026-09-18). */
function markDuplicates(rows: ParsedClientRow[]): ParsedClientRow[] {
  const byPhone = new Map<string, number[]>();
  const byName = new Map<string, number[]>();
  rows.forEach((r) => {
    if (r.values === null) return;
    const phone = r.values.telefono === null ? null : telefonoKey(r.values.telefono);
    const key = phone !== null && phone !== '' ? phone : nombreKey(r.values.nombre);
    const map = phone !== null && phone !== '' ? byPhone : byName;
    map.set(key, [...(map.get(key) ?? []), r.line]);
  });
  return rows.map((r) => {
    if (r.values === null) return r;
    const phone = r.values.telefono === null ? null : telefonoKey(r.values.telefono);
    const hasPhone = phone !== null && phone !== '';
    const same =
      (hasPhone ? byPhone.get(phone ?? '') : byName.get(nombreKey(r.values.nombre))) ?? [];
    if (same.length < 2) return r;
    return {
      line: r.line,
      values: null,
      errors: [...r.errors, `Cliente repetido en el archivo (filas ${same.join(', ')})`],
    };
  });
}

export function parseClientSheet(table: readonly (readonly unknown[])[]): ParseClientResult {
  const [head = [], ...body] = table;
  const index = new Map(head.map((h, i) => [text(h).toLowerCase(), i]));
  const missing = REQUIRED.filter((h) => !index.has(h));
  if (missing.length > 0) return { ok: false, message: `Faltan columnas: ${missing.join(', ')}` };

  const data = body
    .map((cells, i) => ({ cells, line: i + 2 }))
    .filter(({ cells }) => cells.some((c) => text(c) !== ''));
  if (data.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      message: `El archivo tiene ${data.length} filas; el máximo es ${MAX_IMPORT_ROWS}.`,
    };
  }
  const cells = data.map(
    ({ cells: row }) =>
      Object.fromEntries(
        TEMPLATE_HEADERS.map((h) => [h, text(row[index.get(h) ?? -1])]),
      ) as Readonly<Record<Header, string>>,
  );
  const rows = cells.map((c, i) => parseRow(c, data[i]?.line ?? 0));
  return { ok: true, rows: markDuplicates(rows) };
}

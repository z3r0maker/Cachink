import { csvLine, csvNumber, csvText } from '@/lib/csv-write';
import type { PreviewRow } from '@/server/import/templates';

/**
 * «Descargar errores» (P-07): the rows of a previewed import that need
 * fixing, as CSV. Everything but the row number came out of the uploaded
 * file, so it is written as text (audit F-15a): a `sku` of `=cmd|…` must not
 * run when the owner opens the list of what to fix.
 */
export function erroresCsv(rows: readonly PreviewRow[]): string {
  const lines = rows
    .filter((r) => r.kind === 'error')
    .map((r) =>
      csvLine([
        csvNumber(String(r.line)),
        csvText(r.sku),
        csvText(r.nombre),
        csvText(r.errors.join('; ')),
      ]),
    );
  return ['fila,sku,nombre,motivo', ...lines].join('\n');
}

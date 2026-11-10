/**
 * The portal's one CSV writer (audit F-15a); `csv.ts` beside it is the reader.
 *
 * A spreadsheet runs a cell that starts with `=`, `+`, `-` or `@` as a
 * formula, and one that starts with a tab or a carriage return can smuggle one
 * in. The cells the portal exports were typed by an operator at a register or
 * came out of a file somebody uploaded, and the person who opens the export is
 * the owner. So a cell is written as one of two things, and the caller says
 * which:
 *
 * - `csvText`: what somebody typed. A leading trigger gets a single quote in
 *   front, which a spreadsheet reads as «text follows» and does not show.
 * - `csvNumber`: what the app computed. It stays a number, and it is checked
 *   to be one: anything else is written as text.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\n\r]/;
/** Digits with an optional sign and decimals: `1234.50`, `-100.00`. No separators, no exponent. */
const PLAIN_NUMBER = /^-?\d+(?:\.\d+)?$/;

const quoted = (value: string): string =>
  NEEDS_QUOTES.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/** A cell somebody typed: never a formula, whatever it starts with. */
export function csvText(value: string): string {
  return quoted(FORMULA_TRIGGER.test(value) ? `'${value}` : value);
}

/** A number the app computed, e.g. signed pesos; text if it turns out not to be one. */
export function csvNumber(value: string): string {
  return PLAIN_NUMBER.test(value) ? value : csvText(value);
}

/** One row, from cells already written by `csvText` or `csvNumber`. */
export function csvLine(cells: readonly string[]): string {
  return cells.join(',');
}

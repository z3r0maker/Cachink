/**
 * Split a migration's SQL at the Drizzle Kit statement-breakpoint marker.
 *
 * Drizzle Kit emits `--> statement-breakpoint` between DDL statements.
 * Single execution per statement keeps error messages specific and
 * compatible with SQLite drivers that don't allow multiple statements
 * per prepare.
 */

const STATEMENT_BREAKPOINT = /^-->\s*statement-breakpoint\s*$/m;

export function splitStatements(raw: string): readonly string[] {
  return raw
    .split(STATEMENT_BREAKPOINT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

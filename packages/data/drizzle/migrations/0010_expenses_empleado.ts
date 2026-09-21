/**
 * Migration 0010 — `empleado_id` on `expenses` (O-26, approved by the owner
 * 2026-09-19).
 *
 * The phone records a payroll payment as an `expenses` row whose only tie to
 * the employee used to be the text «Nómina {nombre}» — a rename broke it.
 * This column is the data link P-12's employee drawer reads: nullable, because
 * every payroll writer before it lands (and every non-payroll expense, ever)
 * has none. Postgres side: data-pg 0027.
 */

export const migration0010Sql = `
-- 0010_expenses_empleado
--> statement-breakpoint
ALTER TABLE expenses ADD COLUMN empleado_id text
`;

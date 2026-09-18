/**
 * Migration 0002 — the SAT régimen code (owner decision 2026-09-18).
 *
 * `regimen_sat` becomes the business's régimen; `regimen_fiscal` keeps the
 * derived bucket for phones that read names. Existing rows are backfilled
 * with the domain's `regimenFromLegacy`, restated here because a migration is
 * a frozen snapshot — `business-regimen-sat.test.ts` checks the two agree.
 * «Otro» names no régimen in particular, so it stays NULL: the owner picks.
 */

export const migration0002Sql = `
ALTER TABLE businesses ADD COLUMN regimen_sat TEXT;
--> statement-breakpoint
UPDATE businesses SET regimen_sat = CASE
  WHEN regimen_fiscal = 'RESICO' THEN '626'
  WHEN regimen_fiscal = 'RIF' THEN '621'
  WHEN regimen_fiscal = 'Asalariados' THEN '605'
  WHEN regimen_fiscal IN ('601','603','605','606','607','608','610','611','612','614','615','616','620','621','622','623','624','625','626') THEN regimen_fiscal
  ELSE NULL
END;
`.trim();

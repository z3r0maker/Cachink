ALTER TABLE "businesses" ADD COLUMN "regimen_sat" text;--> statement-breakpoint
-- Hand-added backfill: the domain's `regimenFromLegacy`, restated because a
-- migration is a frozen snapshot (a test checks they agree). «Otro» names no
-- régimen in particular, so it stays NULL and the portal asks the owner.
UPDATE "businesses" SET "regimen_sat" = CASE
  WHEN "regimen_fiscal" = 'RESICO' THEN '626'
  WHEN "regimen_fiscal" = 'RIF' THEN '621'
  WHEN "regimen_fiscal" = 'Asalariados' THEN '605'
  WHEN "regimen_fiscal" IN ('601','603','605','606','607','608','610','611','612','614','615','616','620','621','622','623','624','625','626') THEN "regimen_fiscal"
  ELSE NULL
END;

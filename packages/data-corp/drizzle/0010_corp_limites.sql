CREATE TABLE "corp"."annual_caps" (
	"anio" smallint PRIMARY KEY NOT NULL,
	"tope_sas" bigint NOT NULL,
	"tope_resico" bigint NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "annual_caps_anio_check" CHECK ("corp"."annual_caps"."anio" BETWEEN 2000 AND 2100),
	CONSTRAINT "annual_caps_topes_check" CHECK ("corp"."annual_caps"."tope_sas" > 0 AND "corp"."annual_caps"."tope_resico" > 0)
);
--> statement-breakpoint
-- E-15 (hand-added after the generated part): 2026's caps, the figures plan
-- §3 records. The SAS's is the DOF's for 2026; RESICO persona moral's is the
-- law's. Every later year is captured by a founder in the Resumen.
INSERT INTO "corp"."annual_caps" ("anio", "tope_sas", "tope_resico", "updated_by", "updated_at")
VALUES (2026, 767884994, 3500000000, 'migration-0010', now());

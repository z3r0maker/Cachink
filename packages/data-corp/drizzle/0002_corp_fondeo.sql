CREATE TABLE "corp"."funding_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"concepto" text NOT NULL,
	"total" bigint NOT NULL,
	"por_socio" bigint NOT NULL,
	"vence" date NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "funding_calls_amounts_check" CHECK ("corp"."funding_calls"."total" > 0 AND "corp"."funding_calls"."por_socio" * 2 >= "corp"."funding_calls"."total" AND "corp"."funding_calls"."por_socio" * 2 <= "corp"."funding_calls"."total" + 1)
);

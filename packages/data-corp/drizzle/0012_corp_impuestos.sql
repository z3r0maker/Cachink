CREATE TABLE "corp"."tax_returns" (
	"period" text PRIMARY KEY NOT NULL,
	"isr" bigint NOT NULL,
	"iva" bigint NOT NULL,
	"retencion_isr" bigint NOT NULL,
	"retencion_iva" bigint NOT NULL,
	"linea_importe" bigint,
	"linea_vigencia" date,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "tax_returns_period_check" CHECK ("corp"."tax_returns"."period" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "tax_returns_amounts_check" CHECK ("corp"."tax_returns"."isr" >= 0 AND "corp"."tax_returns"."iva" >= 0 AND "corp"."tax_returns"."retencion_isr" >= 0 AND "corp"."tax_returns"."retencion_iva" >= 0),
	CONSTRAINT "tax_returns_linea_check" CHECK ("corp"."tax_returns"."linea_importe" IS NULL OR "corp"."tax_returns"."linea_importe" > 0)
);

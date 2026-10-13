CREATE TABLE "corp"."closed_periods" (
	"period" text PRIMARY KEY NOT NULL,
	"closed_by" text NOT NULL,
	"closed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corp"."entries" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"fecha" date NOT NULL,
	"kind" text NOT NULL,
	"concepto" text NOT NULL,
	"contraparte" text,
	"moneda" text DEFAULT 'MXN' NOT NULL,
	"monto_original" bigint,
	"tipo_cambio" text,
	"deducible" boolean,
	"source" text NOT NULL,
	"source_ref" text,
	"reverses_entry_id" text,
	"payload" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "entries_reverses_entry_id_unique" UNIQUE("reverses_entry_id"),
	CONSTRAINT "entries_source_ref_unique" UNIQUE("source","source_ref"),
	CONSTRAINT "entries_usd_check" CHECK (("corp"."entries"."moneda" = 'MXN' AND "corp"."entries"."monto_original" IS NULL AND "corp"."entries"."tipo_cambio" IS NULL)
          OR ("corp"."entries"."moneda" = 'USD' AND "corp"."entries"."monto_original" > 0 AND "corp"."entries"."tipo_cambio" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "corp"."entry_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"cuenta" text NOT NULL,
	"debe" bigint NOT NULL,
	"haber" bigint NOT NULL,
	"socio" smallint,
	CONSTRAINT "entry_lines_amounts_check" CHECK ("corp"."entry_lines"."debe" >= 0 AND "corp"."entry_lines"."haber" >= 0 AND ("corp"."entry_lines"."debe" > 0 OR "corp"."entry_lines"."haber" > 0)),
	CONSTRAINT "entry_lines_socio_check" CHECK ("corp"."entry_lines"."socio" IS NULL OR "corp"."entry_lines"."socio" IN (1, 2))
);
--> statement-breakpoint
CREATE TABLE "corp"."recurring_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"nombre" text NOT NULL,
	"categoria" text NOT NULL,
	"moneda" text DEFAULT 'MXN' NOT NULL,
	"monto_estimado" bigint NOT NULL,
	"dia_cargo" smallint NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "corp"."entries" ADD CONSTRAINT "entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "corp"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."entry_lines" ADD CONSTRAINT "entry_lines_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "corp"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "corp"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_fecha_idx" ON "corp"."entries" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "entry_lines_entry_idx" ON "corp"."entry_lines" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "entry_lines_cuenta_idx" ON "corp"."entry_lines" USING btree ("cuenta");
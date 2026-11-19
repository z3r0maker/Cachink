CREATE TABLE "corp"."services" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"para" text,
	"categoria" text NOT NULL,
	"cobro" text NOT NULL,
	"estado" text NOT NULL,
	"moneda" text DEFAULT 'MXN' NOT NULL,
	"monto" bigint,
	"dia_cargo" smallint,
	"renueva" date,
	"tarifa" text,
	"aviso" bigint,
	"limite" integer,
	"uso_plan" integer,
	"unidad" text,
	"gasto_mes" bigint,
	"gasto_al" date,
	"paga_con" text,
	"plantilla_id" text,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "services_plantilla_id_unique" UNIQUE("plantilla_id"),
	CONSTRAINT "services_categoria_check" CHECK ("corp"."services"."categoria" IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')),
	CONSTRAINT "services_montos_check" CHECK (("corp"."services"."monto" IS NULL OR "corp"."services"."monto" > 0) AND ("corp"."services"."aviso" IS NULL OR "corp"."services"."aviso" > 0)
          AND ("corp"."services"."gasto_mes" IS NULL OR "corp"."services"."gasto_mes" >= 0)),
	CONSTRAINT "services_cobro_check" CHECK ("corp"."services"."cobro" IN ('fijo', 'uso', 'comision', 'gratis', 'anual')),
	CONSTRAINT "services_estado_check" CHECK ("corp"."services"."estado" IN ('activo', 'por_contratar', 'baja')),
	CONSTRAINT "services_dia_check" CHECK ("corp"."services"."dia_cargo" IS NULL OR "corp"."services"."dia_cargo" BETWEEN 1 AND 31),
	CONSTRAINT "services_plan_check" CHECK (("corp"."services"."limite" IS NULL OR "corp"."services"."limite" > 0) AND ("corp"."services"."uso_plan" IS NULL OR "corp"."services"."uso_plan" >= 0))
);
--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" DROP CONSTRAINT "recurring_templates_monto_check";--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD COLUMN "periodicidad" text DEFAULT 'mensual' NOT NULL;--> statement-breakpoint
ALTER TABLE "corp"."services" ADD CONSTRAINT "services_plantilla_id_recurring_templates_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "corp"."recurring_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_periodicidad_check" CHECK ("corp"."recurring_templates"."periodicidad" IN ('mensual', 'anual'));--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_monto_check" CHECK ("corp"."recurring_templates"."monto_estimado" >= 0);
ALTER TABLE "corp"."recurring_templates" ADD COLUMN "contraparte" text;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD COLUMN "deducible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD COLUMN "desde" text;--> statement-breakpoint
-- A template made before 0005 charges from the month it was made, in Mexico City.
UPDATE "corp"."recurring_templates"
  SET "desde" = to_char("created_at" AT TIME ZONE 'America/Mexico_City', 'YYYY-MM')
  WHERE "desde" IS NULL;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ALTER COLUMN "desde" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_dia_check" CHECK ("corp"."recurring_templates"."dia_cargo" BETWEEN 1 AND 31);--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_monto_check" CHECK ("corp"."recurring_templates"."monto_estimado" > 0);--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_categoria_check" CHECK ("corp"."recurring_templates"."categoria" IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion'));--> statement-breakpoint
ALTER TABLE "corp"."recurring_templates" ADD CONSTRAINT "recurring_templates_desde_check" CHECK ("corp"."recurring_templates"."desde" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');
CREATE TABLE "corp"."received_invoices" (
	"uuid" text PRIMARY KEY NOT NULL,
	"fecha" date NOT NULL,
	"folio" text,
	"emisor_rfc" text NOT NULL,
	"emisor_nombre" text NOT NULL,
	"receptor_rfc" text NOT NULL,
	"uso_cfdi" text NOT NULL,
	"metodo_pago" text NOT NULL,
	"moneda" text NOT NULL,
	"monto_original" bigint,
	"tipo_cambio" text,
	"subtotal" bigint NOT NULL,
	"iva" bigint NOT NULL,
	"retencion_isr" bigint NOT NULL,
	"retencion_iva" bigint NOT NULL,
	"total" bigint NOT NULL,
	"concepto" text NOT NULL,
	"sat_total" text NOT NULL,
	"sello8" text NOT NULL,
	"archivo" text NOT NULL,
	"xml" "bytea" NOT NULL,
	"estado" text NOT NULL,
	"estado_sat" text NOT NULL,
	"categoria" text,
	"project_id" text,
	"entry_id" text,
	"pago_entry_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "received_invoices_entry_id_unique" UNIQUE("entry_id"),
	CONSTRAINT "received_invoices_pago_entry_id_unique" UNIQUE("pago_entry_id"),
	CONSTRAINT "received_invoices_uuid_check" CHECK ("corp"."received_invoices"."uuid" ~ '^[0-9A-F]{8}(-[0-9A-F]{4}){3}-[0-9A-F]{12}$'),
	CONSTRAINT "received_invoices_estado_check" CHECK ("corp"."received_invoices"."estado" IN ('por_revisar', 'registrada', 'cancelada', 'descartada')),
	CONSTRAINT "received_invoices_estado_sat_check" CHECK ("corp"."received_invoices"."estado_sat" IN ('vigente', 'cancelado', 'sin_verificar')),
	CONSTRAINT "received_invoices_metodo_check" CHECK ("corp"."received_invoices"."metodo_pago" IN ('PUE', 'PPD')),
	CONSTRAINT "received_invoices_montos_check" CHECK ("corp"."received_invoices"."subtotal" > 0 AND "corp"."received_invoices"."iva" >= 0 AND "corp"."received_invoices"."retencion_isr" >= 0 AND "corp"."received_invoices"."retencion_iva" >= 0
          AND "corp"."received_invoices"."total" = "corp"."received_invoices"."subtotal" + "corp"."received_invoices"."iva" - "corp"."received_invoices"."retencion_isr" - "corp"."received_invoices"."retencion_iva"),
	CONSTRAINT "received_invoices_usd_check" CHECK (("corp"."received_invoices"."moneda" = 'MXN' AND "corp"."received_invoices"."monto_original" IS NULL AND "corp"."received_invoices"."tipo_cambio" IS NULL)
          OR ("corp"."received_invoices"."moneda" = 'USD' AND "corp"."received_invoices"."monto_original" > 0 AND "corp"."received_invoices"."tipo_cambio" IS NOT NULL)),
	CONSTRAINT "received_invoices_categoria_check" CHECK ("corp"."received_invoices"."categoria" IS NULL OR "corp"."received_invoices"."categoria" IN ('costo_servicio', 'ventas_marketing', 'desarrollo', 'administracion')),
	CONSTRAINT "received_invoices_registrada_check" CHECK ("corp"."received_invoices"."estado" <> 'registrada' OR ("corp"."received_invoices"."entry_id" IS NOT NULL AND "corp"."received_invoices"."categoria" IS NOT NULL)),
	CONSTRAINT "received_invoices_pago_check" CHECK ("corp"."received_invoices"."pago_entry_id" IS NULL OR ("corp"."received_invoices"."metodo_pago" = 'PPD' AND "corp"."received_invoices"."entry_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "corp"."received_invoices" ADD CONSTRAINT "received_invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "corp"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."received_invoices" ADD CONSTRAINT "received_invoices_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "corp"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corp"."received_invoices" ADD CONSTRAINT "received_invoices_pago_entry_id_entries_id_fk" FOREIGN KEY ("pago_entry_id") REFERENCES "corp"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "received_invoices_fecha_idx" ON "corp"."received_invoices" USING btree ("fecha");--> statement-breakpoint
CREATE INDEX "received_invoices_emisor_idx" ON "corp"."received_invoices" USING btree ("emisor_rfc");
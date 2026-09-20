-- C-17 (ADR-073): a sale becomes a ticket + its lines. Each existing sale
-- becomes a one-line ticket (folio = per-device row number); the header
-- columns leave sales. cancelacion_logs points at tickets. Idempotent.
CREATE TABLE IF NOT EXISTS "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"folio" integer NOT NULL,
	"fecha" text NOT NULL,
	"hora" text,
	"concepto" text NOT NULL,
	"metodo" text NOT NULL,
	"cliente_id" text,
	"estado_pago" text NOT NULL,
	"efectivo_recibido_centavos" bigint,
	"cambio_centavos" bigint,
	"caja_turno_id" text,
	"cancel_motivo" text,
	"cancelled_by_user_id" text,
	"cancelled_at" timestamp with time zone,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
INSERT INTO tickets (id, folio, fecha, hora, concepto, metodo, cliente_id, estado_pago,
  efectivo_recibido_centavos, caja_turno_id, cancel_motivo, cancelled_by_user_id, cancelled_at,
  created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at)
SELECT
  id,
  ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY created_at, id),
  fecha, hora, concepto, metodo, cliente_id, estado_pago,
  efectivo_recibido_centavos, caja_turno_id, cancel_motivo, cancelled_by_user_id, cancelled_at,
  created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at
FROM sales
WHERE NOT EXISTS (SELECT 1 FROM tickets t WHERE t.id = sales.id);
--> statement-breakpoint
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS "ticket_id" text;
--> statement-breakpoint
UPDATE public.sales SET ticket_id = id WHERE ticket_id IS NULL;
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "hora";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "metodo";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "cliente_id";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "estado_pago";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "efectivo_recibido_centavos";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "cancelled_by_user_id";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "cancel_motivo";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "cancelled_at";
--> statement-breakpoint
ALTER TABLE public.sales DROP COLUMN IF EXISTS "caja_turno_id";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_sales_ticket ON public.sales (ticket_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_device_folio ON public.tickets (device_id, folio);
--> statement-breakpoint
ALTER TABLE public.cancelacion_logs ADD COLUMN IF NOT EXISTS "ticket_id" text;
--> statement-breakpoint
UPDATE public.cancelacion_logs SET ticket_id = sale_id WHERE ticket_id IS NULL;
--> statement-breakpoint
ALTER TABLE public.cancelacion_logs DROP COLUMN IF EXISTS "sale_id";
--> statement-breakpoint
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.tickets FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON public.tickets;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON public.tickets
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
--> statement-breakpoint
GRANT SELECT, INSERT ON public.tickets TO xangarro_app;

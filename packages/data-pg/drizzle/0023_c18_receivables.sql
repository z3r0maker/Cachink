-- C-18 (ADR-074): receivables become per-client facts, rows created at the
-- register gain a review status, expenses name their turno, and the corte
-- keeps its denomination count. Idempotent: safe to re-run on a migrated DB.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "limite_centavos" bigint;
--> statement-breakpoint
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "plazo_dias" integer;
--> statement-breakpoint
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "estado_revision" text NOT NULL DEFAULT 'aprobado';
--> statement-breakpoint
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "fusionado_con_id" text;
--> statement-breakpoint
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "estado_revision" text NOT NULL DEFAULT 'aprobado';
--> statement-breakpoint
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "fusionado_con_id" text;
--> statement-breakpoint
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS "caja_turno_id" text;
--> statement-breakpoint
ALTER TABLE public.caja_turnos ADD COLUMN IF NOT EXISTS "denominaciones" text;
--> statement-breakpoint
-- client_payments: per-sale → per-client. Backfill from each payment's sale,
-- then drop the rows no sale could attribute (pre-launch data) and the
-- venta_id column itself.
ALTER TABLE public.client_payments ADD COLUMN IF NOT EXISTS "cliente_id" text;
--> statement-breakpoint
UPDATE public.client_payments
SET cliente_id = (SELECT cliente_id FROM public.sales WHERE sales.id = client_payments.venta_id)
WHERE cliente_id IS NULL;
--> statement-breakpoint
DELETE FROM public.client_payments WHERE cliente_id IS NULL;
--> statement-breakpoint
ALTER TABLE public.client_payments DROP COLUMN IF EXISTS "venta_id";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_client_payments_cliente ON public.client_payments (cliente_id);

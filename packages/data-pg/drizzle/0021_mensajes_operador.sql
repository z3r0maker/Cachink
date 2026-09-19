-- Owner↔operator messages (C-19, ADR-075). `mensajes_operador` is written by
-- the portal and pulled by devices; `respuestas_operador` is pushed by the
-- device when an operator answers in Avisos. Read marks are device-local and
-- never travel, so neither table carries them.
CREATE TABLE IF NOT EXISTS "mensajes_operador" (
	"id" text PRIMARY KEY NOT NULL,
	"operador_id" text NOT NULL,
	"caja_turno_id" text,
	"severidad" text NOT NULL,
	"cuerpo" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "respuestas_operador" (
	"id" text PRIMARY KEY NOT NULL,
	"mensaje_id" text NOT NULL,
	"texto" text NOT NULL,
	"business_id" text NOT NULL,
	"device_id" text NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE public.mensajes_operador ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.mensajes_operador FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON public.mensajes_operador;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON public.mensajes_operador
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
--> statement-breakpoint
ALTER TABLE public.respuestas_operador ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.respuestas_operador FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON public.respuestas_operador;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON public.respuestas_operador
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
--> statement-breakpoint
-- The portal writes messages; devices only pull them, so no INSERT grant for
-- the app role. Replies arrive through /sync/push, which runs as the app role.
GRANT SELECT ON public.mensajes_operador TO xangarro_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON public.respuestas_operador TO xangarro_app;

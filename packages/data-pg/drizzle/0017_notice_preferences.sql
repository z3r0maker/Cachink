-- «Cómo quieres enterarte» (P-32): each member's delivery choices per aviso
-- type. Portal-only (ADR-060): never synced, one row per member of a business.
-- `prefs` is a sparse map of overrides; unset types take the defaults in
-- `@xangarro/domain/avisos`, so a new aviso type needs no migration, and a
-- critical type is forced on by the domain whatever is stored here.
CREATE TABLE IF NOT EXISTS "notice_preferences" (
	"business_id" text NOT NULL,
	"user_id" text NOT NULL,
	"prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notice_preferences_pk" PRIMARY KEY ("business_id", "user_id")
);
--> statement-breakpoint
-- Tenant isolation, as 0003: Drizzle Kit does not model policies.
ALTER TABLE public.notice_preferences ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.notice_preferences FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON public.notice_preferences;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON public.notice_preferences
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
--> statement-breakpoint
-- Read and upsert only; a member's row is never deleted by the portal.
REVOKE DELETE ON public.notice_preferences FROM xangarro_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.notice_preferences TO xangarro_app;

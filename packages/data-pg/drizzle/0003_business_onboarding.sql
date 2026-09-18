CREATE TABLE "business_onboarding" (
	"business_id" text PRIMARY KEY NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checklist" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pending_paid_answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"trial_intent" jsonb,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
-- Tenant isolation. Hand-written below the generated DDL because Drizzle Kit
-- does not model policies (the same documented exception as 0001_rls). The
-- claim is wrapped in `(SELECT …)` (audit DB-RLS-02) so the planner evaluates
-- it once per statement as an InitPlan, not once per row.
ALTER TABLE public.business_onboarding ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.business_onboarding FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON public.business_onboarding
  USING (business_id = (SELECT xangarro.current_business_id()))
  WITH CHECK (business_id = (SELECT xangarro.current_business_id()));
--> statement-breakpoint
-- The portal reads and upserts its own row and never deletes one. 0001's
-- default privileges grant DELETE on every new public table, so it is taken
-- back explicitly.
REVOKE DELETE ON public.business_onboarding FROM xangarro_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.business_onboarding TO xangarro_app;

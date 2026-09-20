-- A-05 + ADR-072's promised removal (the merge of the phone track): every
-- user is an operator, NIPs are reset only by the owner from the portal,
-- and nothing reads role / must_change_pin / recovery_password_hash /
-- email. Postgres follows the device's 0007. Idempotent.
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE public.users ALTER COLUMN must_change_pin DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE public.users ALTER COLUMN must_change_pin SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE public.users ALTER COLUMN recovery_password_hash DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions text NOT NULL DEFAULT '{}';
--> statement-breakpoint
UPDATE public.users SET permissions = '{}' WHERE permissions IS NULL;
--> statement-breakpoint
ALTER TABLE public.users DROP COLUMN IF EXISTS role;
--> statement-breakpoint
ALTER TABLE public.users DROP COLUMN IF EXISTS must_change_pin;
--> statement-breakpoint
ALTER TABLE public.users DROP COLUMN IF EXISTS recovery_password_hash;
--> statement-breakpoint
ALTER TABLE public.users DROP COLUMN IF EXISTS email;

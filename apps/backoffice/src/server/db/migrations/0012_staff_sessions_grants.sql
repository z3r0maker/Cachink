-- N-05's follow-up: the daily digest prunes expired staff sessions (older
-- than 30 days — see `staff-sessions-prune.ts`). 0008 granted the admin role
-- everything but DELETE; pruning is the one legitimate delete on this table
-- (it is not audit data — `staff_audit_log` keeps that, append-only), so
-- this grants exactly DELETE and nothing else.

GRANT DELETE ON public.staff_sessions TO xangarro_admin;

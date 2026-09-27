-- `admin_user_email` finds the user by its primary key (DB2-CRON-01; ADR-118).
--
-- 0010 compared `u.id::text = p_user_id`: casting the column hides the
-- auth.users primary key from the planner, so every call scanned the whole
-- table — once per owner on the console's tenants list, which is one scan per
-- row. Casting the parameter instead keeps the index. Same signature, same
-- grants, same answer.
--
-- `business_members.user_id` is text and nothing forces it to be a uuid, and
-- a bad cast would raise where 0010 quietly answered NULL. The CASE only
-- casts a string that has a uuid's shape; anything else matches no user.
-- (A CASE, not an EXCEPTION block: a handler per call opens a subtransaction,
-- the very cost DB2-SYNC-02 is about.)

-- `SET LOCAL`: the timeout dies with this file's transaction instead of
-- staying on the runner's session (R2-13). 200 ms, and the runner retries the
-- whole file with backoff when it expires (DB3-MIG-01; ADR-118 amendment).
SET LOCAL lock_timeout = '200ms';

CREATE OR REPLACE FUNCTION xangarro.admin_user_email(p_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT u.email
    FROM auth.users u
   WHERE u.id = CASE
                  WHEN p_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                  THEN p_user_id::uuid
                END;
$$;

REVOKE ALL ON FUNCTION xangarro.admin_user_email(text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin') THEN
    GRANT EXECUTE ON FUNCTION xangarro.admin_user_email(text) TO xangarro_admin;
  END IF;
END
$$;

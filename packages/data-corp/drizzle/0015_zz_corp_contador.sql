-- Códigos agrupadores (E-43). Hand-written: Drizzle Kit models neither
-- privileges nor triggers. Applied after 0015_corp_contador.sql.
--
-- 1. The console saves lists of codes and their validation; nothing is changed
--    or deleted (ADR-125 §2). The agents read all.

GRANT SELECT, INSERT ON corp.account_code_lists, corp.account_codes,
  corp.account_code_validations TO xangarro_corp;
GRANT SELECT ON corp.account_code_lists, corp.account_codes,
  corp.account_code_validations TO xangarro_corp_agent;

-- 2. Only the newest list may be validated: one validated after a code changed
--    would vouch for codes the contador never saw. A new list and a validation
--    at once take turns on the same lock.

CREATE OR REPLACE FUNCTION corp.account_code_list_lock() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('corp.account_code_lists'));
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS account_code_lists_lock ON corp.account_code_lists;
CREATE TRIGGER account_code_lists_lock
  BEFORE INSERT ON corp.account_code_lists
  FOR EACH ROW EXECUTE FUNCTION corp.account_code_list_lock();

CREATE OR REPLACE FUNCTION corp.account_code_validation_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
DECLARE
  esta timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('corp.account_code_lists'));
  SELECT captured_at INTO esta FROM corp.account_code_lists WHERE id = NEW.list_id;
  IF EXISTS (
    SELECT 1 FROM corp.account_code_lists l
     WHERE l.id <> NEW.list_id AND (l.captured_at, l.id) > (esta, NEW.list_id)
  ) THEN
    RAISE EXCEPTION 'corp code list % is not the newest', NEW.list_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS account_code_validations_allowed ON corp.account_code_validations;
CREATE TRIGGER account_code_validations_allowed
  BEFORE INSERT ON corp.account_code_validations
  FOR EACH ROW EXECUTE FUNCTION corp.account_code_validation_allowed();

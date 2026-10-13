-- The ledger's guards (E-02, ADR-124 §4). Hand-written: Drizzle Kit models
-- neither privileges nor triggers. Applied after 0001_corp_ledger.sql.
--
-- 1. Immutable by grant: the console inserts and reads entries and lines; it
--    never updates or deletes them. A correction is a reversal entry.
-- 2. Balanced at commit: a deferred constraint trigger refuses any entry whose
--    lines do not add up, or that has none. The domain already guarantees it;
--    this is the database refusing to hold anything else.
-- 3. Closed months take nothing: an entry dated in a month in
--    corp.closed_periods is refused before it is written.

GRANT SELECT, INSERT ON corp.entries, corp.entry_lines TO xangarro_corp;
GRANT SELECT, INSERT, UPDATE ON corp.recurring_templates TO xangarro_corp;
GRANT SELECT, INSERT ON corp.closed_periods TO xangarro_corp;
GRANT SELECT ON corp.entries, corp.entry_lines, corp.recurring_templates, corp.closed_periods
  TO xangarro_corp_agent;

CREATE OR REPLACE FUNCTION corp.entry_balances() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
DECLARE
  target text := NEW.entry_id;
  d bigint;
  h bigint;
BEGIN
  SELECT COALESCE(sum(debe), 0), COALESCE(sum(haber), 0) INTO d, h
    FROM corp.entry_lines WHERE entry_id = target;
  IF d = 0 OR d <> h THEN
    RAISE EXCEPTION 'corp entry % does not balance (debe %, haber %)', target, d, h
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS entry_lines_balance ON corp.entry_lines;
CREATE CONSTRAINT TRIGGER entry_lines_balance
  AFTER INSERT ON corp.entry_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION corp.entry_balances();

-- An entry with no lines at all never fires the trigger above; this one does.
CREATE OR REPLACE FUNCTION corp.entry_has_lines() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM corp.entry_lines WHERE entry_id = NEW.id) THEN
    RAISE EXCEPTION 'corp entry % has no lines', NEW.id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS entries_have_lines ON corp.entries;
CREATE CONSTRAINT TRIGGER entries_have_lines
  AFTER INSERT ON corp.entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION corp.entry_has_lines();

CREATE OR REPLACE FUNCTION corp.entry_period_open() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM corp.closed_periods WHERE period = to_char(NEW.fecha, 'YYYY-MM')) THEN
    RAISE EXCEPTION 'corp period % is closed', to_char(NEW.fecha, 'YYYY-MM')
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS entries_period_open ON corp.entries;
CREATE TRIGGER entries_period_open
  BEFORE INSERT ON corp.entries
  FOR EACH ROW EXECUTE FUNCTION corp.entry_period_open();

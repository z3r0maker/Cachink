-- Cierre del mes (E-14). Hand-written: Drizzle Kit models neither privileges,
-- triggers nor functions. Applied after 0013_corp_cierre.sql.
--
-- 1. The console records events and confirms balances; no event is changed
--    or deleted. The agents read both. Nobody is granted DELETE (ADR-125
--    §2): a month's lock is lifted only through 3.

GRANT SELECT, INSERT ON corp.period_events TO xangarro_corp;
GRANT SELECT, INSERT, UPDATE ON corp.bank_balances TO xangarro_corp;
GRANT SELECT ON corp.period_events, corp.bank_balances TO xangarro_corp_agent;

-- 2. Reopening takes both founders. A request needs the month closed and
--    none pending; «reabierto» and «reapertura_rechazada» answer a pending
--    request, and only the other founder may. «cerrado» goes with its lock.

CREATE OR REPLACE FUNCTION corp.period_event_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
DECLARE
  last_kind text;
  last_founder text;
BEGIN
  SELECT kind, founder_id INTO last_kind, last_founder
    FROM corp.period_events
   WHERE period = NEW.period
   ORDER BY seq DESC
   LIMIT 1;
  IF NEW.kind = 'reapertura_pedida' THEN
    IF NOT EXISTS (SELECT 1 FROM corp.closed_periods WHERE period = NEW.period)
       OR last_kind IS NOT DISTINCT FROM 'reapertura_pedida' THEN
      RAISE EXCEPTION 'corp period % cannot be asked to reopen', NEW.period
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.kind IN ('reabierto', 'reapertura_rechazada') THEN
    IF last_kind IS DISTINCT FROM 'reapertura_pedida' OR last_founder = NEW.founder_id THEN
      RAISE EXCEPTION 'corp period % has no request the other founder can answer', NEW.period
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM corp.closed_periods WHERE period = NEW.period) THEN
    RAISE EXCEPTION 'corp period % is recorded closed without its lock', NEW.period
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS period_events_allowed ON corp.period_events;
CREATE TRIGGER period_events_allowed
  BEFORE INSERT ON corp.period_events
  FOR EACH ROW EXECUTE FUNCTION corp.period_event_allowed();

-- 3. The one way a lock is lifted: the other founder's approval, recorded and
--    applied together. It runs as the owner, so the console needs EXECUTE
--    only; the row trigger below refuses any other removal, the owner's too.

CREATE OR REPLACE FUNCTION corp.period_unlock_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  IF (SELECT kind FROM corp.period_events WHERE period = OLD.period ORDER BY seq DESC LIMIT 1)
     IS DISTINCT FROM 'reabierto' THEN
    RAISE EXCEPTION 'corp period % reopens only with both founders', OLD.period
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END
$$;

DROP TRIGGER IF EXISTS closed_periods_unlock ON corp.closed_periods;
CREATE TRIGGER closed_periods_unlock
  BEFORE DELETE ON corp.closed_periods
  FOR EACH ROW EXECUTE FUNCTION corp.period_unlock_allowed();

CREATE OR REPLACE FUNCTION corp.reabrir_periodo(p_period text, p_founder text, p_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, corp
AS $$
BEGIN
  INSERT INTO corp.period_events (period, kind, founder_id, at)
  VALUES (p_period, 'reabierto', p_founder, p_at);
  DELETE FROM corp.closed_periods WHERE period = p_period;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'corp period % is not closed', p_period USING ERRCODE = 'check_violation';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION corp.reabrir_periodo(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION corp.reabrir_periodo(text, text, timestamptz) TO xangarro_corp;

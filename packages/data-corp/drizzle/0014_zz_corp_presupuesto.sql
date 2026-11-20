-- Presupuesto (E-22). Hand-written: Drizzle Kit models neither privileges nor
-- triggers. Applied after 0014_corp_presupuesto.sql.
--
-- 1. The console prepares budgets and asks for spending, and records each
--    answer; nothing is changed or deleted (ADR-125 §2). The agents read all.

GRANT SELECT, INSERT ON corp.budgets, corp.budget_lines, corp.budget_answers,
  corp.spend_requests, corp.spend_request_answers TO xangarro_corp;
GRANT SELECT ON corp.budgets, corp.budget_lines, corp.budget_answers,
  corp.spend_requests, corp.spend_request_answers TO xangarro_corp_agent;

-- 2. A quarter has one budget at a time: a new one only while none waits and
--    none was approved. The lock makes two at once take turns.

CREATE OR REPLACE FUNCTION corp.budget_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('corp.budgets:' || NEW.quarter));
  IF EXISTS (
    SELECT 1 FROM corp.budgets b
      LEFT JOIN corp.budget_answers a ON a.budget_id = b.id
     WHERE b.quarter = NEW.quarter AND (a.kind IS NULL OR a.kind = 'aprobado')
  ) THEN
    RAISE EXCEPTION 'corp quarter % already has a budget', NEW.quarter
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS budgets_allowed ON corp.budgets;
CREATE TRIGGER budgets_allowed
  BEFORE INSERT ON corp.budgets
  FOR EACH ROW EXECUTE FUNCTION corp.budget_allowed();

-- 3. Only the other founder answers a budget.

CREATE OR REPLACE FUNCTION corp.budget_answer_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  IF (SELECT prepared_by FROM corp.budgets WHERE id = NEW.budget_id) = NEW.founder_id THEN
    RAISE EXCEPTION 'corp budget % is answered by the other founder', NEW.budget_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS budget_answers_allowed ON corp.budget_answers;
CREATE TRIGGER budget_answers_allowed
  BEFORE INSERT ON corp.budget_answers
  FOR EACH ROW EXECUTE FUNCTION corp.budget_answer_allowed();

-- 4. Only the other founder answers a request that waits on them, and never
--    for more than was asked.

CREATE OR REPLACE FUNCTION corp.spend_answer_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
DECLARE
  r corp.spend_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM corp.spend_requests WHERE id = NEW.request_id;
  IF r.automatica OR r.founder_id = NEW.founder_id OR NEW.monto > r.monto THEN
    RAISE EXCEPTION 'corp spend request % is not the other founder''s to answer', NEW.request_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS spend_request_answers_allowed ON corp.spend_request_answers;
CREATE TRIGGER spend_request_answers_allowed
  BEFORE INSERT ON corp.spend_request_answers
  FOR EACH ROW EXECUTE FUNCTION corp.spend_answer_allowed();

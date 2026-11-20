-- Tablero (E-20). Hand-written: Drizzle Kit models neither privileges nor
-- triggers. Applied after 0016_corp_tablero.sql.
--
-- 1. The console records plans, cards and their events, objectives and their
--    progress, the clause and the notices; nothing is deleted (ADR-125 §2). A
--    card changes only its values, its quote and the quarter it left a plan
--    in. The agents read all.

GRANT SELECT, INSERT ON corp.board_plan_events, corp.board_cards, corp.board_card_events,
  corp.board_objectives, corp.board_objective_progress, corp.board_clauses,
  corp.board_notices TO xangarro_corp;
GRANT UPDATE (value_f1, value_f2, quote, quote_document_id, dropped_in, updated_by, updated_at)
  ON corp.board_cards TO xangarro_corp;
GRANT SELECT ON corp.board_plan_events, corp.board_cards, corp.board_card_events,
  corp.board_objectives, corp.board_objective_progress, corp.board_clauses,
  corp.board_notices TO xangarro_corp_agent;

-- 2. A plan is sent from a draft (nothing yet, or rejected), and only the
--    other partner answers what was sent. Two answers at once take turns.

CREATE OR REPLACE FUNCTION corp.board_plan_event_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
DECLARE
  last corp.board_plan_events%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('corp.board_plan:' || NEW.quarter));
  SELECT * INTO last FROM corp.board_plan_events
   WHERE quarter = NEW.quarter ORDER BY at DESC, id DESC LIMIT 1;
  IF NEW.kind = 'enviado' AND last.kind IS NOT NULL AND last.kind <> 'rechazado' THEN
    RAISE EXCEPTION 'corp board plan % is not a draft', NEW.quarter
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.kind <> 'enviado' AND (last.kind IS DISTINCT FROM 'enviado' OR last.socio = NEW.socio) THEN
    RAISE EXCEPTION 'corp board plan % is the other partner''s to answer', NEW.quarter
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS board_plan_events_allowed ON corp.board_plan_events;
CREATE TRIGGER board_plan_events_allowed
  BEFORE INSERT ON corp.board_plan_events
  FOR EACH ROW EXECUTE FUNCTION corp.board_plan_event_allowed();

-- 3. The owner starts, finishes and does a card; the other partner accepts or
--    objects. Events of one card take turns, so an acceptance and an
--    objection at once cannot both land.

CREATE OR REPLACE FUNCTION corp.board_card_event_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
DECLARE
  card_owner smallint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('corp.board_card:' || NEW.card_id));
  SELECT owner INTO card_owner FROM corp.board_cards WHERE id = NEW.card_id;
  IF NEW.kind IN ('iniciada', 'terminada', 'hecha') AND NEW.socio <> card_owner THEN
    RAISE EXCEPTION 'corp board card % is moved by its owner', NEW.card_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.kind IN ('aceptada', 'objetada') AND NEW.socio = card_owner THEN
    RAISE EXCEPTION 'corp board card % is reviewed by the other partner', NEW.card_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS board_card_events_allowed ON corp.board_card_events;
CREATE TRIGGER board_card_events_allowed
  BEFORE INSERT ON corp.board_card_events
  FOR EACH ROW EXECUTE FUNCTION corp.board_card_event_allowed();

-- 4. A value is frozen once work starts or a quote sets it, and a card taken
--    off a plan stays off. Takes the card's lock, like its events.

CREATE OR REPLACE FUNCTION corp.board_card_update_allowed() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, corp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('corp.board_card:' || OLD.id));
  IF (NEW.value_f1, NEW.value_f2, NEW.quote) IS DISTINCT FROM (OLD.value_f1, OLD.value_f2, OLD.quote)
     AND (OLD.quote IS NOT NULL OR EXISTS (SELECT 1 FROM corp.board_card_events WHERE card_id = OLD.id)) THEN
    RAISE EXCEPTION 'corp board card % has its value frozen', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.dropped_in IS NOT NULL AND NEW.dropped_in IS DISTINCT FROM OLD.dropped_in THEN
    RAISE EXCEPTION 'corp board card % already left a plan', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS board_cards_update_allowed ON corp.board_cards;
CREATE TRIGGER board_cards_update_allowed
  BEFORE UPDATE ON corp.board_cards
  FOR EACH ROW EXECUTE FUNCTION corp.board_card_update_allowed();

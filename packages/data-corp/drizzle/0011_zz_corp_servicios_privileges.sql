-- The services' privileges (E-24). Hand-written: Drizzle Kit models no
-- privileges. Applied after 0011_corp_servicios.sql.
--
-- The console adds a service and edits it, a drop included (an UPDATE of
-- estado); no row is deleted, so its history stays. The agents read them:
-- what MEXIA pays for is the company's, and `paga_con` names a card by its
-- last four digits only.

GRANT SELECT, INSERT, UPDATE ON corp.services TO xangarro_corp;
GRANT SELECT ON corp.services TO xangarro_corp_agent;

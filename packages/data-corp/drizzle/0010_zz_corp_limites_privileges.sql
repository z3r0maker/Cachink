-- The year's caps' privileges (E-15). Hand-written: Drizzle Kit models no
-- privileges. Applied after 0010_corp_limites.sql.
--
-- The console captures a year's caps and corrects them; the agents read them,
-- since the caps are public figures and their gauges are the company's.

GRANT SELECT, INSERT, UPDATE ON corp.annual_caps TO xangarro_corp;
GRANT SELECT ON corp.annual_caps TO xangarro_corp_agent;

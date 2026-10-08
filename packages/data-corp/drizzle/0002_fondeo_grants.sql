-- Funding calls' privileges (E-03, ADR-124 §2). Hand-written: Drizzle Kit
-- models no privileges. Applied after 0002_corp_fondeo.sql.
--
-- A call is written once and never changed: its halves live in the ledger
-- (source_ref llamada:<id>:F<n>), so there is nothing to update or delete.

GRANT SELECT, INSERT ON corp.funding_calls TO xangarro_corp;
GRANT SELECT ON corp.funding_calls TO xangarro_corp_agent;

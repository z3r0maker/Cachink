-- The corporate book's privileges and seed (E-06). Hand-written: Drizzle Kit
-- models no privileges. Applied after 0004_corp_corporativo.sql.
--
-- 1. Share events and certificates are written once: a correction or a
--    renewal is a new row. The registries' status changes as the paperwork
--    moves, so the console may update them; never delete.
-- 2. The five registries of board CD-05 start empty, in the board's order.
--    The founders fill in status, number and next step.

GRANT SELECT, INSERT ON corp.share_events, corp.certificates TO xangarro_corp;
GRANT SELECT, UPDATE ON corp.registries TO xangarro_corp;
GRANT SELECT ON corp.share_events, corp.certificates, corp.registries TO xangarro_corp_agent;

INSERT INTO corp.registries (id, nombre, autoridad, estado, siguiente, folder, sort_order) VALUES
  ('rfc', 'RFC de MEXIA', 'SAT', 'Por registrar', 'Inscribir a MEXIA en el RFC.', 'sat', 1),
  ('sas', 'Sociedad por Acciones Simplificada', 'Secretaría de Economía', 'Por registrar',
   'Constituir la sociedad.', 'constitucion', 2),
  ('marca', 'Marca Xangarro', 'IMPI', 'Por registrar',
   'Ceder la marca a MEXIA (acuerdo, cláusula Novena).', 'impi', 3),
  ('banco', 'Cuenta bancaria', 'Banco', 'Por registrar',
   'Abrir la cuenta a nombre de MEXIA.', 'contratos', 4),
  ('dominios', 'Dominios xangarro.mx', 'Registrador', 'Por registrar',
   'Transferir a MEXIA (acuerdo, cláusula Novena).', 'contratos', 5)
ON CONFLICT (id) DO NOTHING;

-- Impuestos (E-13, ADR-148). Hand-written: Drizzle Kit models neither
-- privileges nor data. Applied after 0012_corp_impuestos.sql.
--
-- 1. The console captures the contador's figures and corrects them until the
--    month is paid (an UPDATE); no row is deleted. The agents read them.

GRANT SELECT, INSERT, UPDATE ON corp.tax_returns TO xangarro_corp;
GRANT SELECT ON corp.tax_returns TO xangarro_corp_agent;

-- 2. The Agenda's «ISR provisional» and «IVA mensual» become one obligation,
--    «ISR e IVA» (impuestos_mensual): the SAT takes them in one declaration,
--    with one acuse and one línea de captura. Where a month has both rows,
--    the ISR row stays, takes the IVA row's documents and the less advanced
--    status of the two, and the IVA row goes. Every other row is renamed.

CREATE TEMP TABLE impuestos_par AS
SELECT i.id AS isr_id,
       v.id AS iva_id,
       CASE
         WHEN array_position(ARRAY['pendiente', 'preparada', 'presentada', 'pagada']::text[], i.status)
           <= array_position(ARRAY['pendiente', 'preparada', 'presentada', 'pagada']::text[], v.status)
         THEN i.status
         ELSE v.status
       END AS status,
       (i.no_payment AND v.no_payment) AS no_payment
  FROM corp.obligations i
  JOIN corp.obligations v ON v.period = i.period AND v.template_id = 'iva_mensual'
 WHERE i.template_id = 'isr_mensual';

UPDATE corp.documents d
   SET obligation_id = p.isr_id
  FROM impuestos_par p
 WHERE d.obligation_id = p.iva_id;

UPDATE corp.obligations o
   SET status = p.status,
       no_payment = (p.status = 'pagada' AND p.no_payment)
  FROM impuestos_par p
 WHERE o.id = p.isr_id;

DELETE FROM corp.obligations o
 USING impuestos_par p
 WHERE o.id = p.iva_id;

UPDATE corp.obligations
   SET template_id = 'impuestos_mensual'
 WHERE template_id IN ('isr_mensual', 'iva_mensual');

DROP TABLE impuestos_par;

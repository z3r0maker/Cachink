-- One receipt per pushed row (UP + HYBRID). seq is unique per tenant, interleaved across tables
-- (rn*4 + k); written straight from each source table so no staging copy is needed.
INSERT INTO sync_receipts (table_name, row_id, seq, device_id, row_updated_at, received_at, business_id)
SELECT 'tickets', id, row_number() OVER w * 4 + 0, device_id, updated_at, created_at + interval '3 hours', business_id FROM tickets WINDOW w AS (PARTITION BY business_id ORDER BY id);
INSERT INTO sync_receipts (table_name, row_id, seq, device_id, row_updated_at, received_at, business_id)
SELECT 'sales', id, row_number() OVER w * 4 + 1, device_id, updated_at, created_at + interval '3 hours', business_id FROM sales WINDOW w AS (PARTITION BY business_id ORDER BY id);
INSERT INTO sync_receipts (table_name, row_id, seq, device_id, row_updated_at, received_at, business_id)
SELECT 'expenses', id, row_number() OVER w * 4 + 3, device_id, updated_at, created_at + interval '3 hours', business_id FROM expenses WINDOW w AS (PARTITION BY business_id ORDER BY id);
CHECKPOINT;
INSERT INTO sync_log (seq, table_name, row_id, op, business_id, created_at, updated_at)
SELECT row_number() OVER w * 4 + 2, 'inventory_movements', id, 'insert', business_id, created_at, created_at FROM inventory_movements WINDOW w AS (PARTITION BY business_id ORDER BY id);
INSERT INTO sync_receipts (table_name, row_id, seq, device_id, row_updated_at, received_at, business_id)
SELECT 'inventory_movements', l.row_id, l.seq, m.device_id, m.updated_at, m.created_at + interval '3 hours', m.business_id
FROM sync_log l JOIN inventory_movements m ON m.id = l.row_id;
UPDATE sync_cursors c SET last_seq = m.mx FROM (SELECT business_id, max(seq) mx FROM sync_receipts GROUP BY 1) m WHERE m.business_id = c.business_id;
VACUUM ANALYZE;

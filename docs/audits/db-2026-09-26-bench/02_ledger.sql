-- Tickets, sale lines (avg 1.8/ticket), stock movements (for stocked products), expenses.
DROP TABLE IF EXISTS bench.tk;
CREATE UNLOGGED TABLE bench.tk AS
SELECT t.id AS business_id, t.ndev, t.nprod, i,
       (CASE WHEN t.months = 1 THEN timestamptz '2026-09-01 08:00-06'
             ELSE timestamptz '2025-10-01 08:00-06' END)
         + ((i::double precision / (t.tpm * t.months)) * t.months * 30) * interval '1 day'
         + ((i * 7919) % 43200) * interval '1 second' AS ts
FROM bench.tenants t, generate_series(1::bigint, (t.tpm * t.months)::bigint) i;

INSERT INTO tickets (id, business_id, device_id, folio, fecha, hora, concepto, metodo, estado_pago, efectivo_recibido_centavos, created_at, updated_at)
SELECT bench.ulid(ts, business_id||'t'||i), business_id, 'DEV-'||business_id||'-'||(1 + i % ndev), i,
       to_char(ts AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'), to_char(ts AT TIME ZONE 'America/Mexico_City', 'HH24:MI'),
       'Venta', (ARRAY['Efectivo','Efectivo','Efectivo','Transferencia','Tarjeta','Crédito'])[1 + i % 6], 'pagado', NULL, ts, ts
FROM bench.tk;

INSERT INTO sales (id, business_id, device_id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id, cantidad, created_at, updated_at)
SELECT bench.ulid(k.ts, k.business_id||'s'||k.i||'-'||l), k.business_id, 'DEV-'||k.business_id||'-'||(1 + k.i % k.ndev),
       bench.ulid(k.ts, k.business_id||'t'||k.i),
       to_char(k.ts AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'), 'Producto', 'Producto',
       2000 + ((k.i * 31 + l) % 20000), p.id, 1 + (k.i % 3), k.ts, k.ts
FROM bench.tk k
CROSS JOIN LATERAL generate_series(1, CASE WHEN k.i % 5 = 0 THEN 1 ELSE 2 END - CASE WHEN k.i % 5 IN (1,2) THEN 1 ELSE 0 END + CASE WHEN k.i % 5 = 3 THEN 1 ELSE 0 END) l
JOIN bench.prod p ON p.business_id = k.business_id AND p.k = 1 + ((k.i * 13 + l * 7) % k.nprod);

INSERT INTO inventory_movements (id, business_id, device_id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo, origen, created_at, updated_at)
SELECT bench.ulid(s.created_at, s.id||'m'), s.business_id, s.device_id, s.producto_id, s.fecha, 'salida', s.cantidad, 1500, 'Venta', 'venta', s.created_at, s.created_at
FROM sales s JOIN bench.prod p ON p.id = s.producto_id WHERE p.seguir_stock;

INSERT INTO expenses (id, business_id, device_id, fecha, concepto, categoria, monto_centavos, created_at, updated_at)
SELECT bench.ulid(ts, business_id||'e'||i), business_id, 'DEV-'||business_id||'-1',
       to_char(ts AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD'), 'Gasto', (ARRAY['Materia Prima','Renta','Servicios','Nómina','Otro'])[1 + i % 5], 5000 + (i % 90000), ts, ts
FROM bench.tk WHERE i % 10 = 0;

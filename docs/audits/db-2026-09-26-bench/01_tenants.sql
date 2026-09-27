-- Synthetic tenants. Scaled 1:5 on tenant count (1,000 regular + 5 whales), full plan mix.
CREATE SCHEMA IF NOT EXISTS bench;
CREATE OR REPLACE FUNCTION bench.ulid(ts timestamptz, salt text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT upper(lpad(to_hex((extract(epoch from ts)*1000)::bigint),12,'0') || substr(md5(salt),1,14)) $$;

DROP TABLE IF EXISTS bench.tenants;
CREATE TABLE bench.tenants AS
SELECT g AS n,
       bench.ulid(timestamptz '2025-01-01' + g * interval '1 minute', 'biz'||g) AS id,
       CASE WHEN g <= 600 THEN 'small' WHEN g <= 900 THEN 'mid' WHEN g <= 1000 THEN 'heavy' ELSE 'whale' END AS tier,
       CASE WHEN g <= 600 THEN 300 WHEN g <= 900 THEN 3000 WHEN g <= 1000 THEN 10000 ELSE 30000 END AS tpm,
       CASE WHEN g <= 1000 THEN 1 ELSE 12 END AS months,
       CASE WHEN g <= 600 THEN 40 WHEN g <= 900 THEN 200 WHEN g <= 1000 THEN 600 ELSE 2000 END AS nprod,
       CASE WHEN g <= 600 THEN 1 WHEN g <= 900 THEN 2 WHEN g <= 1000 THEN 3 ELSE 4 END AS ndev
FROM generate_series(1, 1003) g;

INSERT INTO businesses (id, business_id, device_id, nombre, regimen_fiscal, isr_tasa, created_at, updated_at)
SELECT id, id, 'DEV-'||id||'-1', 'Negocio '||n, 'RESICO', 125, now(), now() FROM bench.tenants;

INSERT INTO devices (id, business_id, nombre, plataforma, created_at, updated_at, last_push_at)
SELECT 'DEV-'||t.id||'-'||d, t.id, 'Caja '||d, 'android', now(), now(), now()
FROM bench.tenants t, generate_series(1, t.ndev) d;

INSERT INTO sync_cursors (business_id, last_seq) SELECT id, 0 FROM bench.tenants;

INSERT INTO products (id, business_id, device_id, nombre, categoria, costo_unit_centavos, unidad, precio_venta_centavos, seguir_stock, created_at, updated_at)
SELECT bench.ulid(timestamptz '2025-06-01' + p * interval '1 second', t.id||'p'||p), t.id, 'DEV-'||t.id||'-1',
       'Producto '||p, 'Producto Terminado', 1000 + (p*37 % 9000), 'pza', 2000 + (p*53 % 20000), (p % 10) < 7, now(), now()
FROM bench.tenants t, generate_series(1, t.nprod) p;

DROP TABLE IF EXISTS bench.prod;
CREATE TABLE bench.prod AS
SELECT business_id, id, seguir_stock, row_number() OVER (PARTITION BY business_id ORDER BY id) AS k FROM products;
CREATE INDEX ON bench.prod (business_id, k);
ANALYZE bench.prod;

-- Businesses with rows their phones could not send (B-16).
-- Studio runs as an owner role, so this spans every tenant; oldest first.
SELECT r.business_id,
       b.nombre AS negocio,
       r.code,
       count(*) AS filas,
       min(r.received_at) AS desde
FROM sync_rejections r
JOIN businesses b ON b.id = r.business_id
WHERE r.resolved_at IS NULL
GROUP BY r.business_id, b.nombre, r.code
ORDER BY desde;

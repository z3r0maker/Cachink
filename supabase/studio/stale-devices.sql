-- Active phones not heard from in 7 days (B-16): a lost phone, or one stuck
-- offline with unsent sales. "Heard from" is the later of push and pull.
SELECT d.business_id,
       b.nombre AS negocio,
       d.id AS device_id,
       d.nombre AS dispositivo,
       -- The one definition lives in data-pg's device-last-seen.ts
       -- (`greatest(last_push_at, last_pull_at)`, created_at floor); this
       -- doc query mirrors it for Studio ad-hoc use only.
       greatest(d.last_push_at, d.last_pull_at) AS visto
FROM devices d
JOIN businesses b ON b.id = d.business_id
WHERE d.revoked_at IS NULL
  AND coalesce(greatest(d.last_push_at, d.last_pull_at), d.created_at) < now() - interval '7 days'
ORDER BY visto NULLS FIRST;

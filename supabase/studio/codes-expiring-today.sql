-- Activation codes nobody has used that expire in the next 24 hours (B-16):
-- the shopkeeper may be waiting on a phone. Shows who it was sent to, never the code.
SELECT a.business_id,
       b.nombre AS negocio,
       a.email,
       a.expires_at
FROM activation_codes a
JOIN businesses b ON b.id = a.business_id
WHERE a.redeemed_at IS NULL
  AND a.expires_at BETWEEN now() AND now() + interval '24 hours'
ORDER BY a.expires_at;

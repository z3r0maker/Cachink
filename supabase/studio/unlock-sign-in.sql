-- Unlock an owner locked out by too many wrong passwords (B-16, ADR-079).
-- The throttle stores sha256("login:email:<address>"); Postgres computes the
-- same key, so ops never needs the app to do this. Replace the address.
SELECT xangarro.throttle_clear(
  encode(sha256(convert_to('login:email:' || lower('pedro@taqueria.mx'), 'UTF8')), 'hex')
);

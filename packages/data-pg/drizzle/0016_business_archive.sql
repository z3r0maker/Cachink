-- Archiving a business (P-08's archive row): «Se archivan tus registros y se
-- desvinculan todos los dispositivos. No se borra nada.»
--
-- One SECURITY DEFINER function, because ending the portal sessions touches
-- `xangarro.portal_sessions`, which the app role cannot reach. It archives
-- **the tenant of the current transaction only** — `current_business_id()`,
-- set by `withTenant` from the server's own session — never an id passed in,
-- so the function cannot be pointed at someone else's business. The portal
-- checks the caller is the owner (and that no subscription will keep
-- charging) before it calls this.
CREATE OR REPLACE FUNCTION xangarro.business_archive()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  biz text := xangarro.current_business_id();
BEGIN
  IF biz IS NULL THEN
    RAISE EXCEPTION 'business_archive needs a tenant' USING ERRCODE = '42501';
  END IF;
  UPDATE public.businesses SET deleted_at = now(), updated_at = now()
  WHERE id = biz AND deleted_at IS NULL;
  UPDATE public.devices SET revoked_at = now()
  WHERE business_id = biz AND revoked_at IS NULL;
  UPDATE xangarro.portal_sessions SET revoked_at = now()
  WHERE business_id = biz AND revoked_at IS NULL;
END
$$;

REVOKE ALL ON FUNCTION xangarro.business_archive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.business_archive() TO xangarro_app;

-- An archived business is no one's to sign in to: the membership lookup skips
-- it, so password, reset and sign-in links all stop at «no business». Same
-- signature and body as 0002 plus the join; reactivating is a support action
-- that clears `deleted_at`.
CREATE OR REPLACE FUNCTION xangarro.memberships_for_user(p_user_id text)
RETURNS TABLE (business_id text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT m.business_id, m.role
  FROM public.business_members m
  JOIN public.businesses b ON b.id = m.business_id AND b.deleted_at IS NULL
  WHERE m.user_id = p_user_id
  ORDER BY m.created_at;
$$;

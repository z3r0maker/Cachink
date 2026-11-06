-- 0052: the purge of superseded product photos (ADR-134, B-19).
--
-- `product_images` is append-only (0050): replacing a photo inserts a newer
-- row and removing it inserts a tombstone, so every change leaves the old
-- bytes behind. A row is garbage once a newer row of the same product has
-- existed for `p_days`: by then every device that pulls has the newer one, and
-- a device further behind simply gets the newer row (the pull skips a logged
-- id whose row is gone). The newest row of a product never goes, so a
-- tombstone stays until a photo supersedes it.
--
-- The app role may not DELETE from the table, and the purge runs from a cron
-- with no tenant, across every business, so it is a SECURITY DEFINER like
-- `account_erase` (0051). It returns how many rows it deleted.

SET LOCAL lock_timeout = '200ms';

CREATE OR REPLACE FUNCTION xangarro.product_images_purge(p_days integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_purged integer;
BEGIN
  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'product_images_purge: the window is at least one day, got %', p_days
      USING ERRCODE = '22023';
  END IF;
  DELETE FROM public.product_images o
   WHERE EXISTS (
     SELECT 1 FROM public.product_images n
      WHERE n.business_id = o.business_id
        AND n.producto_id = o.producto_id
        AND n.deleted_at IS NULL
        AND (n.created_at, n.id) > (o.created_at, o.id)
        AND n.created_at <= now() - make_interval(days => p_days));
  GET DIAGNOSTICS v_purged = ROW_COUNT;
  RETURN v_purged;
END
$$;

REVOKE ALL ON FUNCTION xangarro.product_images_purge(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION xangarro.product_images_purge(integer) TO xangarro_app;

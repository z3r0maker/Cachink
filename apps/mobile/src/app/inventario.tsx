/**
 * Legacy redirect: /inventario → /productos (UXD-R3, ADR-045).
 *
 * Kept for one release so bookmarks / deep links don't break.
 * Remove after the next version bump.
 */

import { Redirect } from 'expo-router';

export default function InventarioRedirect() {
  return <Redirect href="/productos" />;
}

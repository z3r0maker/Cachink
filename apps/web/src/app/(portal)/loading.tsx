import { DonCargando } from '@/components/don/cargando';

/**
 * The portal's loading state — every route, one file (ADR-107).
 *
 * Replaces the static gray blocks of S-1: the owner asked for feedback while a
 * page loads, and Don Cuentas counting is that feedback. The shell stays put:
 * this fills `(portal)/layout.tsx`'s content area, so the sidebar and header
 * never move.
 */
export default function PortalLoading() {
  return <DonCargando />;
}

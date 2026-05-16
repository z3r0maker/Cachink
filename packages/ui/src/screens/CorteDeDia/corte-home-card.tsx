/**
 * CorteHomeCard — previously rendered the end-of-day cash reconciliation
 * card when the Caja feature flag was OFF. Now that Caja is always-on,
 * this component is dead code and always returns null.
 *
 * TODO: remove CorteHomeCard entirely — Caja is always-on now
 * (supersedes corte del día). Left as a no-op stub so callers don't
 * need updating in this changeset.
 */

import type { ReactElement } from 'react';

export interface CorteHomeCardProps {
  /** When true, suppress the visual card — only render the modal. */
  readonly hideCard?: boolean;
  /** Called when the gate says the corte should show. */
  readonly onShowChange?: (shouldShow: boolean) => void;
  /** Open the modal programmatically (controlled mode). */
  readonly openExternal?: boolean;
  /** Called when the modal closes (so parent can reset openExternal). */
  readonly onModalClose?: () => void;
  readonly testID?: string;
}

// TODO: remove CorteHomeCard — Caja is always-on now (supersedes corte del día)
export function CorteHomeCard(_props: CorteHomeCardProps): ReactElement | null {
  return null;
}

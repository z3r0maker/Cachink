/**
 * Caja tool items — the shift-floor shortcuts rendered inside the Caja tab
 * (review item #7, ADR-052). Moved here from the retired Otros screen
 * (ADR-053): the Operator is the only role on the device, and Caja is the
 * only place these cards render.
 *
 * Items are filtered by feature flags so a post-MVP tool appears by
 * adding one entry.
 */

import type { FeatureFlags } from '@xangarro/domain';
import type { IconName } from '../../components/Icon/index';

export interface OtrosItem {
  readonly key: string;
  readonly icon: IconName;
  readonly labelKey: string;
  readonly descriptionKey?: string;
  readonly path: string;
}

interface FlagItem {
  readonly item: OtrosItem;
  readonly flagCheck: (f: FeatureFlags) => boolean;
}

const ALWAYS_ITEMS: readonly OtrosItem[] = [
  {
    key: 'caja-movimientos',
    icon: 'arrow-down-up',
    labelKey: 'otros.cajaMovimientos',
    descriptionKey: 'otros.desc.cajaMovimientos',
    path: '/caja-movimientos',
  },
  {
    key: 'cancelaciones',
    icon: 'circle-x',
    labelKey: 'otros.cancelaciones',
    descriptionKey: 'otros.desc.cancelaciones',
    path: '/cancelaciones',
  },
] as const;

/** Post-MVP tools appear here behind their flag (e.g. ventas-credito, Z-01). */
const FLAG_ITEMS: readonly FlagItem[] = [] as const;

/**
 * Tool cards shown inside Caja. `testID`s stay `otros-<key>` so existing
 * Maestro flows keep addressing them; the rename is A-15.
 */
export function operativoCajaToolItems(flags: FeatureFlags): OtrosItem[] {
  const flagItems = FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
  return [...ALWAYS_ITEMS, ...flagItems];
}

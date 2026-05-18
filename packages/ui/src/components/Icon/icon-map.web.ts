/**
 * Web icon map — maps IconName to lucide-react components.
 *
 * Split across icon-map-core.web.ts and icon-map-product.web.ts
 * to keep each file under 200 lines.
 */
import type { Home } from 'lucide-react';
import type { IconName } from './icon.shared';
import { ICONS_CORE } from './icon-map-core.web';
import { ICONS_PRODUCT } from './icon-map-product.web';

export const ICONS: Record<IconName, typeof Home> = {
  ...ICONS_CORE,
  ...ICONS_PRODUCT,
} as Record<IconName, typeof Home>;

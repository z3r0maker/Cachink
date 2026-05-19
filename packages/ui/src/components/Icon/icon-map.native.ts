/**
 * Native icon map — maps IconName to lucide-react-native components.
 *
 * Split across icon-map-core.native.ts and icon-map-product.native.ts
 * to keep each file under 200 lines.
 */
import type { Home } from 'lucide-react-native';
import type { IconName } from './icon.shared';
import { ICONS_CORE } from './icon-map-core.native';
import { ICONS_PRODUCT } from './icon-map-product.native';

export const ICONS: Record<IconName, typeof Home> = {
  ...ICONS_CORE,
  ...ICONS_PRODUCT,
} as Record<IconName, typeof Home>;

/**
 * Which frame the caja wears at this width (El Mostrador §10): the four-tab
 * bar under 760 px, the 88 px icon rail with the top bar from 760, the full
 * sidebar from 1280. Reads `useWindowDimensions`, so it follows rotation and
 * split view; the edges are `cajaBreakpoints` in `@xangarro/tokens`.
 */
import { useWindowDimensions } from 'react-native';
import { cajaBreakpoints } from '../../theme';

export type CajaLayout = 'phone' | 'rail' | 'sidebar';

export function cajaLayoutFor(width: number): CajaLayout {
  if (width >= cajaBreakpoints.sidebar) return 'sidebar';
  if (width >= cajaBreakpoints.rail) return 'rail';
  return 'phone';
}

export function useCajaLayout(): CajaLayout {
  return cajaLayoutFor(useWindowDimensions().width);
}

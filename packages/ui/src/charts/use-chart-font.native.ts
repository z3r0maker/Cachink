/**
 * use-chart-font.native.ts — Loads Plus Jakarta Sans via Skia useFont()
 * for Victory Native XL axis labels.
 */
import { useFont } from '@shopify/react-native-skia';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fontAsset = require('../../assets/fonts/PlusJakartaSans-Medium.ttf') as number;

/** Returns a Skia SkFont or null while loading. */
export function useChartFont(size = 11): ReturnType<typeof useFont> {
  return useFont(fontAsset, size);
}

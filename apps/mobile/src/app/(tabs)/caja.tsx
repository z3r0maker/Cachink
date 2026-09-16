/**
 * Expo Router entry for /caja — cash drawer management.
 *
 * Thin wrapper around `CajaContent`, which also hosts the shift tools
 * (movimientos de caja, cancelaciones) below the turn (ADR-052).
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CajaContent, operativoCajaToolItems, useFeatureFlags } from '@xangarro/ui';

export default function CajaTabRoute(): ReactElement {
  const router = useRouter();
  const flags = useFeatureFlags();
  return (
    <CajaContent
      testID="mobile-caja-tab"
      toolItems={operativoCajaToolItems(flags)}
      onNavigateTool={(path) => router.push(path as never)}
    />
  );
}

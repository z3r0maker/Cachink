/**
 * Expo Router entry for /caja tab — cash drawer management.
 *
 * Thin wrapper around `CajaContent` (packages/ui) which handles
 * the open/closed turn logic, AbrirCajaModal, and CerrarCajaModal.
 *
 * Review item #7: the Operativo bar dropped its "Otros" tab, so this
 * screen also hosts that role's tool grid (movimientos de caja,
 * cancelaciones) below the turn. Same `otros-<key>` testIDs, one tap
 * from the bar — exactly what Otros cost before. The Director doesn't
 * get the grid here; their tools live in Configuración.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CajaContent, operativoCajaToolItems, useFeatureFlags, useRole } from '@cachink/ui';

export default function CajaTabRoute(): ReactElement {
  const router = useRouter();
  const role = useRole();
  const flags = useFeatureFlags();
  const toolItems = role === 'director' ? undefined : operativoCajaToolItems(flags);

  return (
    <CajaContent
      testID="mobile-caja-tab"
      toolItems={toolItems}
      onNavigateTool={(path) => router.push(path as never)}
    />
  );
}

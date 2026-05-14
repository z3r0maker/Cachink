/**
 * Expo Router entry for /caja — cash drawer management.
 *
 * Thin wrapper around `CajaContent` (packages/ui) which handles
 * the open/closed turn logic, AbrirCajaModal, and CerrarCajaModal.
 *
 * Refactored per CLAUDE.md §6 (40-line budget).
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CajaContent } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function CajaRoute(): ReactElement {
  const router = useRouter();
  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <CajaContent testID="mobile-caja" />
    </AppShellWrapper>
  );
}

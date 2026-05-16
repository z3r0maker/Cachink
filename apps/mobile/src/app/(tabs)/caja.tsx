/**
 * Expo Router entry for /caja tab — cash drawer management.
 *
 * Thin wrapper around `CajaContent` (packages/ui) which handles
 * the open/closed turn logic, AbrirCajaModal, and CerrarCajaModal.
 *
 * This is a first-class tab (not a sub-route of Otros) so the Caja
 * tab stays highlighted in the bottom bar.
 */

import type { ReactElement } from 'react';
import { CajaContent } from '@cachink/ui';

export default function CajaTabRoute(): ReactElement {
  return <CajaContent testID="mobile-caja-tab" />;
}

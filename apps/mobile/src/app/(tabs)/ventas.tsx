/**
 * Expo Router entry for /ventas: the turno's sales, each cancellable with a
 * reason and never edited or deleted (Track M decision of 2026-09-27). Today
 * this is the Cancelaciones list; M-08 redraws it with the sale sheet.
 */

import type { ReactElement } from 'react';
import { CancelacionesScreen } from '@xangarro/ui';

export default function VentasTabRoute(): ReactElement {
  return <CancelacionesScreen testID="mobile-cancelaciones" />;
}

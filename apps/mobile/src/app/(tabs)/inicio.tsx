/**
 * Expo Router entry for /inicio. Until M-06 builds Inicio («Para hoy», the
 * turno at a glance), the tab shows what the phone already has for it: the
 * turno's summary and the rows to the rest of the caja, the same as Mi turno
 * without its lock bar. Nothing on it is a placeholder (ADR-117).
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CajaContent, TurnoRows } from '@xangarro/ui';

export default function InicioTabRoute(): ReactElement {
  const router = useRouter();
  return (
    <CajaContent
      testID="mobile-inicio-tab"
      footer={<TurnoRows onNavigate={(path) => router.navigate(path as never)} />}
    />
  );
}

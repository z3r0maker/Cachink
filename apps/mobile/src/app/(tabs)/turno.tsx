/**
 * Expo Router entry for /turno («Mi turno», MvTurno; Track M, M-09): who and
 * since when, the cash that must be there and where it comes from, the
 * turno's figures, the big rows to Gastos, Fiado y abonos, Inventario,
 * Movimientos de caja, No enviados and Ajustes, and the foot: «Bloquear la
 * caja» (phone only; a tablet's rail carries it) and «Cerrar turno», which
 * opens /cierre. Read fresh each time the tab comes into view.
 */

import { useCallback, type ReactElement } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { MiTurnoScreen, SinTurno, useCajaLayout, useMiTurno, useSetUserId } from '@xangarro/ui';

export default function TurnoTabRoute(): ReactElement {
  const router = useRouter();
  const setUserId = useSetUserId();
  const turno = useMiTurno();
  const telefono = useCajaLayout() === 'phone';
  const { refetch } = turno;
  useFocusEffect(useCallback(() => refetch(), [refetch]));
  return (
    <MiTurnoScreen
      state={turno.state}
      vista={turno.vista}
      vivas={turno.vivas}
      onNavigate={(path) => router.navigate(path as never)}
      onCerrar={() => router.navigate('/cierre' as never)}
      onBloquear={telefono ? () => setUserId(null) : null}
      onRetry={refetch}
      sinTurno={<SinTurno />}
    />
  );
}

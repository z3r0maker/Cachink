/**
 * Expo Router entry for /turno («Mi turno», Track M, M-09; board MvTurno):
 * the turno's figures, its movements and the queue band, «Cerrar mi turno»
 * to /cierre, and the big rows to Gastos, Inventario, Movimientos de
 * caja, No enviados and Ajustes, with «Bloquear la caja» in the thumb zone.
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LockBar, MiTurnoScreen, TurnoRows, useMiTurno, useSetUserId } from '@xangarro/ui';

export default function TurnoTabRoute(): ReactElement {
  const router = useRouter();
  const setUserId = useSetUserId();
  const t = useMiTurno();
  return (
    <View style={{ flex: 1 }}>
      <MiTurnoScreen
        testID="mobile-turno"
        state={t.state}
        data={t.data}
        cola={t.cola}
        onCerrar={() => router.navigate('/cierre' as never)}
        onRetry={t.refetch}
        onIrAInicio={() => router.navigate('/inicio' as never)}
        onVerVentas={() => router.navigate('/ventas' as never)}
        onRegistrar={(x) => router.navigate(`/gastos?recurrente=${x.id}` as never)}
        foot={
          <>
            <TurnoRows onNavigate={(path) => router.navigate(path as never)} />
            <LockBar onLock={() => setUserId(null)} />
          </>
        }
      />
    </View>
  );
}

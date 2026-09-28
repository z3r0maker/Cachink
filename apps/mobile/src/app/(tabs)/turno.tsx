/**
 * Expo Router entry for /turno («Mi turno»): the cash drawer and the turno
 * (`CajaContent`: open, movements, cierre), the big rows to Gastos,
 * Inventario, Movimientos de caja, No enviados and Ajustes, and on the phone
 * «Bloquear la caja» in the thumb zone. M-09 redraws the screen itself.
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CajaContent, LockBar, TurnoRows, useSetUserId } from '@xangarro/ui';

export default function TurnoTabRoute(): ReactElement {
  const router = useRouter();
  const setUserId = useSetUserId();
  return (
    <View style={{ flex: 1 }}>
      <CajaContent
        testID="mobile-caja-tab"
        footer={<TurnoRows onNavigate={(path) => router.navigate(path as never)} />}
      />
      <LockBar onLock={() => setUserId(null)} />
    </View>
  );
}

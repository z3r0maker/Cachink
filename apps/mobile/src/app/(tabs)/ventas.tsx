/**
 * Expo Router entry for /ventas (MvVentas, MvCancelarVenta; Track M, M-08):
 * the turno's sales, each opened in its sheet, sent as a comprobante or
 * cancelled with a reason, never edited or deleted.
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { VentasTurnoFlow } from '@xangarro/ui';

export default function VentasTabRoute(): ReactElement {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }} testID="mobile-ventas-tab">
      <VentasTurnoFlow onIrAInicio={() => router.navigate('/inicio' as never)} />
    </View>
  );
}

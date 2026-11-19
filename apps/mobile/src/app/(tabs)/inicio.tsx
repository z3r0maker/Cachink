/**
 * Expo Router entry for /inicio, the caja's landing (MvInicio, TbInicio;
 * Track M, M-06): the greeting, «Lo primero», the turno's figures, «Para hoy»
 * and the last closes, read fresh each time the tab comes into view. «Abrir
 * turno» opens the fondo sheet over it (MvAbrirTurno).
 */

import { useCallback, type ReactElement } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { InicioScreen, useAperturaTurno, useHoyNo, useInicio } from '@xangarro/ui';

export default function InicioTabRoute(): ReactElement {
  const router = useRouter();
  const inicio = useInicio();
  const hoyNo = useHoyNo();
  const apertura = useAperturaTurno();
  const { refetch } = inicio;
  useFocusEffect(useCallback(() => refetch(), [refetch]));
  return (
    <View style={{ flex: 1 }} testID="mobile-inicio-tab">
      <InicioScreen
        state={inicio.state}
        data={inicio.data}
        hoyNo={hoyNo}
        onNavigate={(path) => router.navigate(path as never)}
        onAbrirTurno={apertura.abrir}
        onRetry={refetch}
      />
      {apertura.hoja}
    </View>
  );
}

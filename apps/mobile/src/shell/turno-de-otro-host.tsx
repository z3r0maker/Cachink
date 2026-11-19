/**
 * TurnoDeOtroHost — «El turno de Ana sigue abierto» over the app (M-21,
 * ADR-071 §3; MvTurnoDeOtro). Mounted with the overlays, so it sits above the
 * tabs right after the newcomer's NIP and the router is already up beneath
 * it: «Contar y cerrar» steps aside and opens /cierre on the caja's turno.
 * Nothing shows on the operator's own turno, with no turno open, or once they
 * chose to continue.
 */
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TurnoDeOtroScreen, useTurnoDeOtro } from '@xangarro/ui';

export function TurnoDeOtroHost(): ReactElement | null {
  const router = useRouter();
  const x = useTurnoDeOtro();
  if (x === null) return null;
  const { alCerrar, ...props } = x;
  return (
    <View style={StyleSheet.absoluteFill}>
      <TurnoDeOtroScreen
        {...props}
        onCerrar={() => {
          alCerrar();
          router.push('/cierre');
        }}
      />
    </View>
  );
}

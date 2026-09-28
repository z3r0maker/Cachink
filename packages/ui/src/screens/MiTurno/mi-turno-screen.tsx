/**
 * MiTurnoScreen — the Mi turno tab (MvTurno; the web's `TurnoScreen`): who
 * and since when, «Efectivo que debe haber» with where it comes from, Ventas
 * and Cobrado, the big rows to the rest of the caja with what each knows
 * live, and the foot: «Bloquear la caja» and «Cerrar turno» (→ Cierre).
 * With no turno open, the «Abrir turno» card over the same rows.
 *
 * Presentational but for the no-turno card (`SinTurno`, which opens the
 * fondo sheet itself): the route hands it `useMiTurno()` and navigation.
 */
import type { ReactElement, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { ErrorState, Spinner } from '../../components/index';
import { colors } from '../../theme';
import { TurnoRows, type TurnoRowsVivas } from '../AppShell/turno-nav';
import type { MiTurnoState } from './use-mi-turno';
import type { MiTurnoVista } from './mi-turno-vista';
import { EsperadoHero } from './mi-turno-esperado';
import { Cabeza, Cifras, Pie } from './mi-turno-partes';

export interface MiTurnoScreenProps {
  readonly state: MiTurnoState;
  readonly vista: MiTurnoVista | null;
  readonly vivas: TurnoRowsVivas;
  readonly onNavigate: (path: string) => void;
  /** «Cerrar turno»: the Cierre route. */
  readonly onCerrar: () => void;
  /** Null on a tablet, where the rail and the sidebar carry the lock. */
  readonly onBloquear: (() => void) | null;
  readonly onRetry: () => void;
  /** The no-turno card; the stories pass their own. */
  readonly sinTurno?: ReactNode;
}

function Cuerpo(p: MiTurnoScreenProps): ReactElement {
  const v = p.vista;
  return (
    <ScrollView
      testID="mi-turno"
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 14 }}
    >
      {v === null ? (
        p.sinTurno
      ) : (
        <>
          <Cabeza turno={v.turno} iniciales={v.iniciales} dia={v.dia} />
          <EsperadoHero partes={v.turno} esperado={v.turno.esperado} />
          <Cifras turno={v.turno} />
        </>
      )}
      <TurnoRows onNavigate={p.onNavigate} vivas={p.vivas} />
    </ScrollView>
  );
}

export function MiTurnoScreen(props: MiTurnoScreenProps): ReactElement {
  if (props.state === 'error') {
    return (
      <ErrorState
        title="No pudimos cargar tu turno"
        body="Tus ventas están guardadas en la caja. Intenta otra vez."
        retryLabel="Reintentar"
        onRetry={props.onRetry}
        testID="mi-turno-error"
      />
    );
  }
  if (props.state === 'loading') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="mi-turno-cargando">
        <Spinner />
      </View>
    );
  }
  const abierto = props.state === 'happy';
  return (
    <View flex={1} backgroundColor={colors.gray200}>
      <Cuerpo {...props} />
      <Pie onBloquear={props.onBloquear} onCerrar={abierto ? props.onCerrar : null} />
    </View>
  );
}

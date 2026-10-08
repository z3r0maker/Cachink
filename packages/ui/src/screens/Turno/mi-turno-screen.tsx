/**
 * MiTurnoScreen — the /turno tab (Track M, M-09; board states turno,
 * con-registros-por-enviar, sin-turno): the cash that must be in the drawer,
 * today's four figures, the gastos that are due, and every movement of the
 * turno. «Cerrar mi turno» opens the Cierre flow. Presentational: the route
 * hands it `useMiTurno()` and the navigation.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { PendienteRecurrente, TurnoData } from '@xangarro/caja/turno';
import { MText } from '../../components/Mostrador/index';
import { CierreBanda, type ColaCierre } from './cierre-banda';
import { MiTurnoCifras } from './mi-turno-cifras';
import { MiTurnoEstados, type MiTurnoEstado } from './mi-turno-estados';
import { MiTurnoHero } from './mi-turno-hero';
import { MiTurnoMovimientos } from './mi-turno-movimientos';
import { MiTurnoPendientes } from './mi-turno-pendientes';
import { colors } from '../../theme';

export interface MiTurnoScreenProps {
  readonly state: MiTurnoEstado;
  readonly data: TurnoData | null;
  /** The queue, as Cierre's band counts it (the same warning, here). */
  readonly cola: ColaCierre;
  /** «Cerrar mi turno»: opens the Cierre flow. */
  readonly onCerrar: () => void;
  readonly onRetry: () => void;
  /** The sin-turno and empty way forward. */
  readonly onIrAInicio: () => void;
  /** «Ver ventas»: the Ventas tab. */
  readonly onVerVentas: () => void;
  /** A due gasto's «Registrar»: Gastos, with the sheet opened on it. */
  readonly onRegistrar?: (x: PendienteRecurrente) => void;
  /**
   * The tab's foot — the big rows and «Bloquear la caja» — rendered INSIDE
   * the scroll, after the movements (MvTurno: one scroll, the CTA never
   * squeezed by a fixed column under it).
   */
  readonly foot?: ReactElement;
  readonly testID?: string;
}

function Cabeza(p: { readonly data: TurnoData }): ReactElement {
  return (
    <View gap={2}>
      <MText size="xl4" weight="extraBold" letterSpacing={-0.8} role="heading">
        Mi turno
      </MText>
      <MText
        size="sm"
        weight="semibold"
        color={colors.gray600}
      >{`${p.data.operador}, ${p.data.caja}, desde las ${p.data.desde}`}</MText>
    </View>
  );
}

function EnBlanco(): ReactElement {
  return (
    <View
      testID="turno-movimientos-vacio"
      padding={24}
      gap={8}
      alignItems="center"
      backgroundColor={colors.white}
    >
      <MText size="lg" weight="extraBold" textAlign="center">
        Tu turno va en blanco
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600} textAlign="center">
        Todavía no has capturado nada. En cuanto cobres la primera venta, aparece aquí.
      </MText>
    </View>
  );
}

function ConDatos(p: MiTurnoScreenProps & { readonly data: TurnoData }): ReactElement {
  const conMovimientos = p.data.movimientos.length > 0;
  return (
    <ScrollView
      testID={p.testID ?? 'mi-turno'}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <Cabeza data={p.data} />
      {p.cola.porEnviar > 0 ? <CierreBanda {...p.cola} /> : null}
      <MiTurnoHero data={p.data} onCerrar={p.onCerrar} />
      <MiTurnoCifras data={p.data} />
      {p.onRegistrar ? (
        <MiTurnoPendientes items={p.data.pendientes} onRegistrar={p.onRegistrar} />
      ) : null}
      {conMovimientos ? (
        <MiTurnoMovimientos items={p.data.movimientos} onVerVentas={p.onVerVentas} />
      ) : (
        <EnBlanco />
      )}
      {p.foot ?? null}
    </ScrollView>
  );
}

export function MiTurnoScreen(p: MiTurnoScreenProps): ReactElement {
  const happy = p.state === 'happy' && p.data !== null;
  if (p.state === 'empty' && p.data !== null) {
    // The turno exists and says its figures; only its movements are gone.
    return <ConDatos {...p} data={p.data} />;
  }
  if (!happy) {
    const id = p.state === 'happy' ? 'loading' : p.state;
    // The route's identity testID rides every state, and the foot stays:
    // locking needs no turno (caja-lock records whoever was signed in), and
    // the rows are the way to the stack routes whatever the turno says. One
    // scroll, so the foot can be reached when the estado runs long.
    return (
      <View flex={1} testID={p.testID}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View flex={1}>
            <MiTurnoEstados id={id} onRetry={p.onRetry} onIrAInicio={p.onIrAInicio} />
          </View>
          {p.foot ?? null}
        </ScrollView>
      </View>
    );
  }
  return <ConDatos {...p} data={p.data} />;
}

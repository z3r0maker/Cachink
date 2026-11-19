/**
 * MiTurnoScreen — the /turno tab (Track M, M-09; board MvTurno): the head,
 * the cash that must be in the drawer (its parts folded under «Ver de dónde
 * sale»), Ventas and Cobrado, and «Lo de tu turno»'s rows in one scroll;
 * «Bloquear la caja» and «Cerrar turno» fixed under it, above the tab bar.
 * With records still to send the band warns over the hero and the close
 * stays (ADR-123). Presentational: the route hands it `useMiTurno()`, the
 * rows and the navigation.
 */
import type { ReactElement, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import type { TurnoData } from '@xangarro/caja/turno';
import { CierreBanda, type ColaCierre } from './cierre-banda';
import { MiTurnoCabeza } from './mi-turno-cabeza';
import { MiTurnoCifras } from './mi-turno-cifras';
import { MiTurnoEstados, type MiTurnoEstado } from './mi-turno-estados';
import { MiTurnoHero } from './mi-turno-hero';
import { MiTurnoPie } from './mi-turno-pie';

export interface MiTurnoScreenProps {
  readonly state: MiTurnoEstado;
  readonly data: TurnoData | null;
  /** The queue, as Cierre's band counts it (the same warning, here). */
  readonly cola: ColaCierre;
  /** «Cerrar turno»: opens the Cierre flow. */
  readonly onCerrar: () => void;
  /** «Bloquear la caja» (phone; the rail and the sidebar carry it on a tablet). */
  readonly onBloquear?: () => void;
  readonly onRetry: () => void;
  /** The empty state's way forward. */
  readonly onIrAInicio: () => void;
  /** Sin turno: opens the fondo sheet over this screen. */
  readonly onAbrirTurno: () => void;
  /**
   * «Lo de tu turno»: the rows to the stack routes, at the end of the
   * scroll in every state (they are the way to Gastos, Inventario, Ajustes…
   * whatever the turno says).
   */
  readonly filas?: ReactNode;
  readonly testID?: string;
}

/** The scroll over the fixed foot. */
function Marco(p: {
  readonly testID?: string;
  readonly pie: ReactElement | null;
  readonly children: ReactNode;
  readonly grow?: boolean;
}): ReactElement {
  return (
    <View flex={1} testID={p.testID}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={p.grow ? { flexGrow: 1 } : { padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        {p.children}
      </ScrollView>
      {p.pie}
    </View>
  );
}

function ConDatos(p: MiTurnoScreenProps & { readonly data: TurnoData }): ReactElement {
  return (
    <Marco
      testID={p.testID ?? 'mi-turno'}
      pie={
        <MiTurnoPie onCerrar={p.onCerrar} {...(p.onBloquear ? { onBloquear: p.onBloquear } : {})} />
      }
    >
      <MiTurnoCabeza data={p.data} />
      {p.cola.porEnviar > 0 ? <CierreBanda {...p.cola} /> : null}
      <MiTurnoHero data={p.data} />
      <MiTurnoCifras data={p.data} />
      {p.filas ?? null}
    </Marco>
  );
}

export function MiTurnoScreen(p: MiTurnoScreenProps): ReactElement {
  // An open turno with nothing captured yet still says its figures.
  if ((p.state === 'happy' || p.state === 'empty') && p.data !== null) {
    return <ConDatos {...p} data={p.data} />;
  }
  const id = p.state === 'happy' ? 'loading' : p.state;
  // The route's identity testID rides every state, and so do the rows and
  // the lock: locking needs no turno (caja-lock records whoever was signed
  // in), and the rows are the way to the stack routes whatever the turno
  // says (MvTurnoCerrado keeps its own face above them).
  return (
    <Marco
      grow
      pie={<MiTurnoPie {...(p.onBloquear ? { onBloquear: p.onBloquear } : {})} />}
      {...(p.testID === undefined ? {} : { testID: p.testID })}
    >
      <View flex={1}>
        <MiTurnoEstados
          id={id}
          onRetry={p.onRetry}
          onIrAInicio={p.onIrAInicio}
          onAbrirTurno={p.onAbrirTurno}
        />
      </View>
      {p.filas === undefined ? null : <View padding={16}>{p.filas}</View>}
    </Marco>
  );
}

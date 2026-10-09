/**
 * InventarioScreen — «Inventario» (Track M, M-09; the web operador's
 * `InventarioScreen` said on the phone): what there is and what moved in
 * this turno — the three figures, the two tabs, the search — and the two
 * entries the phone allows, «Entrada de mercancía» and «Registrar merma»,
 * as sheets over it. Presentational: the route hands it `useInventario()`,
 * the retry and, when Inicio's «Para hoy» sent one, the product whose
 * llegada sheet opens on arrival.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  buscar,
  type InventarioData,
  type NuevoMovimientoVivo,
  type Pestana,
  type TipoMovimiento,
} from '@xangarro/caja/inventario';
import { ErrorState, Spinner } from '../../components/index';
import { Buscador, Cabeza, Kpis, Pestanas, Regla } from './inventario-cifras';
import { ExistenciasLista, SinProductos } from './existencias-lista';
import { LlegoMercanciaSheet } from './llego-mercancia-sheet';
import { MermaSheet } from './merma-sheet';
import { BotonMov } from './mover-botones';
import { MovimientosLista } from './movimientos-lista';
import { MovToast, useMovToast } from './mov-toast';
import { useHoja, type Hoja } from './use-hoja';

export interface InventarioScreenProps {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: InventarioData | null;
  /** The owner's first name, for the empty answer and the regla note. */
  readonly dueno: string;
  /** Which tab the screen opens on (the web's `tab`); existencias by default. */
  readonly tabInicial?: Pestana;
  /** A product to restock now: its «Llegó mercancía» opens (Inicio's «Para hoy»). */
  readonly reponer?: string | null;
  readonly registrar: (m: NuevoMovimientoVivo) => Promise<void>;
  readonly onRetry: () => void;
  readonly testID?: string;
}

/** The board's toolbar: the tabs, the search, and the two labelled entries. */
function Barra(p: {
  readonly tab: Pestana;
  readonly items: number;
  readonly movs: number;
  readonly query: string;
  readonly onQuery: (q: string) => void;
  readonly onTab: (t: Pestana) => void;
  readonly onAbrir: (tipo: TipoMovimiento) => void;
}): ReactElement {
  return (
    <>
      <Pestanas tab={p.tab} items={p.items} movs={p.movs} onElegir={p.onTab} />
      {p.tab === 'existencias' ? <Buscador q={p.query} onQ={p.onQuery} /> : null}
      <View flexDirection="column" gap={10}>
        <BotonMov tipo="Entrada" onPress={() => p.onAbrir('Entrada')} />
        <BotonMov tipo="Merma" onPress={() => p.onAbrir('Merma')} />
      </View>
    </>
  );
}

/** What the tab shows: the existencias with their regla, or the movements. */
function Cuerpo(p: {
  readonly tab: Pestana;
  readonly data: InventarioData;
  readonly query: string;
  readonly dueno: string;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
}): ReactElement {
  if (p.data.existencias.length === 0) return <SinProductos dueno={p.dueno} />;
  if (p.tab === 'movimientos') {
    return <MovimientosLista movs={p.data.movimientos} items={p.data.existencias} />;
  }
  return (
    <>
      <ExistenciasLista
        items={buscar(p.data.existencias, p.query)}
        query={p.query}
        onMover={p.onMover}
      />
      <Regla dueno={p.dueno} />
    </>
  );
}

/** The sheet that is open, with the session's firma around the write. */
function Hojas(p: {
  readonly hoja: Hoja | null;
  readonly data: InventarioData;
  readonly onGuardar: (m: NuevoMovimientoVivo) => Promise<void>;
  readonly onClose: () => void;
}): ReactElement | null {
  if (p.hoja === null) return null;
  const shared = {
    open: true,
    items: p.data.existencias,
    preselect: p.hoja.productoId,
    firma: `${p.data.operador}, ${p.data.caja}`,
    onClose: p.onClose,
    onGuardar: p.onGuardar,
  };
  return p.hoja.tipo === 'Entrada' ? (
    <LlegoMercanciaSheet {...shared} />
  ) : (
    <MermaSheet {...shared} />
  );
}

function Contenido(p: InventarioScreenProps & { readonly data: InventarioData }): ReactElement {
  const [tab, setTab] = useState<Pestana>(p.tabInicial ?? 'existencias');
  const [query, setQuery] = useState('');
  const { hoja, abrir, cerrar } = useHoja(p.reponer ?? null, p.data.existencias);
  const { toast, guardar, cerrar: cerrarToast } = useMovToast(p.registrar);
  const onGuardar = (m: NuevoMovimientoVivo): Promise<void> => guardar(m, p.data.existencias);
  return (
    <>
      <ScrollView
        testID={p.testID ?? 'inventario'}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <Cabeza />
        <Kpis items={p.data.existencias} movs={p.data.movimientos} />
        <Barra
          tab={tab}
          items={p.data.existencias.length}
          movs={p.data.movimientos.length}
          query={query}
          onQuery={setQuery}
          onTab={setTab}
          onAbrir={(tipo) => abrir(tipo, null)}
        />
        <Cuerpo tab={tab} data={p.data} query={query} dueno={p.dueno} onMover={abrir} />
      </ScrollView>
      <Hojas hoja={hoja} data={p.data} onGuardar={onGuardar} onClose={cerrar} />
      {toast === null ? null : <MovToast x={toast} onClose={cerrarToast} />}
    </>
  );
}

export function InventarioScreen(p: InventarioScreenProps): ReactElement {
  // The route's identity testID rides every state — flows assert the
  // screen, not whichever branch the data left it in.
  if (p.state === 'error' || (p.state === 'happy' && p.data === null)) {
    return (
      <View flex={1} testID={p.testID}>
        <ErrorState
          title="No pudimos cargar el inventario"
          body="Lo que hay y lo que se movió sigue en tu negocio. Intenta otra vez."
          retryLabel="Intentar otra vez"
          onRetry={p.onRetry}
          testID="inventario-error"
        />
      </View>
    );
  }
  if (p.data === null) {
    return (
      <View flex={1} testID={p.testID}>
        <View flex={1} alignItems="center" justifyContent="center" testID="inventario-cargando">
          <Spinner />
        </View>
      </View>
    );
  }
  return <Contenido {...p} data={p.data} />;
}

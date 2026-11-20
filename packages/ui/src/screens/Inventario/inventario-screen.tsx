/**
 * InventarioScreen — «Inventario» (Track M, M-09; RvInventario): what there
 * is and what moved in this turno — the three figures, the two tabs, the
 * search — and one tap per row that opens «¿Qué pasó con la mercancía?» on
 * that product, with «Llegó mercancía» or «Se echó a perder» chosen from its
 * stock (item 6); each product's square takes its photo (M-13). No products
 * yet is Don with «Producto nuevo». Presentational: the route hands it
 * `useInventario()`, `useFotoFlujo()`, the retry, the way to a new product
 * and, when Inicio's «Para hoy» sent one, the product whose llegada sheet
 * opens on arrival.
 */
import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import {
  buscar,
  type InventarioData,
  type NuevoMovimientoVivo,
  type Pestana,
} from '@xangarro/caja/inventario';
import { CajaEstado, EstadoCargando } from '../../components/index';
import { Buscador, Kpis, Pestanas, Regla } from './inventario-cifras';
import { InventarioEscaner, type InventarioEscanerProps } from './inventario-escaner';
import { InventarioTitulo } from './inventario-titulo';
import { FotoHojas } from '../../foto-producto/foto-hojas';
import { PistaFoto } from '../../foto-producto/foto-tile';
import type { FotoFlujo } from '../../foto-producto/use-foto-flujo';
import { ExistenciasLista, SinProductos, type OnFoto } from './existencias-lista';
import { tipoAlAbrir } from './mover-logica';
import { MovimientoSheet } from './mover-sheet';
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
  /** «Producto nuevo» on the empty state (the quick add); without it, Don alone. */
  readonly onNuevoProducto?: () => void;
  /** The product photo's steps (M-13, `useFotoFlujo()`); without it the squares only show. */
  readonly foto?: FotoFlujo;
  /** «Escanear» beside the title (M-20); without it, no escáner. */
  readonly escaner?: InventarioEscanerProps;
  readonly onRetry: () => void;
  readonly testID?: string;
}

/** The board's toolbar: the tabs, and on existencias the search and the photo hint. */
function Barra(p: {
  readonly tab: Pestana;
  readonly items: number;
  readonly movs: number;
  readonly query: string;
  readonly onQuery: (q: string) => void;
  readonly onTab: (t: Pestana) => void;
}): ReactElement {
  return (
    <>
      <Pestanas tab={p.tab} items={p.items} movs={p.movs} onElegir={p.onTab} />
      {p.tab === 'existencias' ? <Buscador q={p.query} onQ={p.onQuery} /> : null}
      {p.tab === 'existencias' ? <PistaFoto /> : null}
    </>
  );
}

/** What the tab shows: the existencias with their regla, or the movements. */
function Cuerpo(p: {
  readonly tab: Pestana;
  readonly data: InventarioData;
  readonly query: string;
  readonly dueno: string;
  readonly onAbrir: (it: InventarioData['existencias'][number]) => void;
  readonly onFoto: OnFoto;
}): ReactElement {
  if (p.tab === 'movimientos') {
    return <MovimientosLista movs={p.data.movimientos} items={p.data.existencias} />;
  }
  return (
    <>
      <ExistenciasLista
        items={buscar(p.data.existencias, p.query)}
        query={p.query}
        onAbrir={p.onAbrir}
        onFoto={p.onFoto}
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
  const id = p.hoja?.productoId ?? null;
  const item = p.data.existencias.find((e) => e.id === id);
  if (p.hoja === null || item === undefined) return null;
  return (
    <MovimientoSheet
      key={`${item.id}-${p.hoja.tipo}`}
      item={item}
      tipo={p.hoja.tipo}
      delEscaner={p.hoja.delEscaner ?? false}
      firma={`${p.data.operador}, ${p.data.caja}`}
      onClose={p.onClose}
      onGuardar={p.onGuardar}
    />
  );
}

/** A row's square to the photo's steps: tap, tap with a photo, long press. */
function porFoto(flujo: FotoFlujo | undefined): OnFoto {
  return (it, gesto) => {
    if (flujo === undefined) return;
    const s = { id: it.id, nombre: it.nombre, icono: it.icono, tint: it.tint };
    if (gesto === 'larga') flujo.galeria(s);
    else flujo.abrir(s, gesto === 'tapConFoto');
  };
}

/** The figures, the tabs and what the tab shows, once there are products. */
function ConProductos(
  p: InventarioScreenProps & {
    readonly data: InventarioData;
    readonly onAbrir: (it: InventarioData['existencias'][number]) => void;
  },
): ReactElement {
  const [tab, setTab] = useState<Pestana>(p.tabInicial ?? 'existencias');
  const [query, setQuery] = useState('');
  return (
    <>
      <Kpis items={p.data.existencias} movs={p.data.movimientos} />
      <Barra
        tab={tab}
        items={p.data.existencias.length}
        movs={p.data.movimientos.length}
        query={query}
        onQuery={setQuery}
        onTab={setTab}
      />
      <Cuerpo
        tab={tab}
        data={p.data}
        query={query}
        dueno={p.dueno}
        onAbrir={p.onAbrir}
        onFoto={porFoto(p.foto)}
      />
    </>
  );
}

function Contenido(p: InventarioScreenProps & { readonly data: InventarioData }): ReactElement {
  const vivo = useHoja(p.reponer ?? null, p.data.existencias);
  const { hoja, abrir, cerrar } = vivo;
  const [escaneando, setEscaneando] = useState(false);
  const { toast, guardar, cerrar: cerrarToast } = useMovToast(p.registrar);
  const onGuardar = (m: NuevoMovimientoVivo): Promise<void> => guardar(m, p.data.existencias);
  return (
    <>
      <ScrollView
        testID={p.testID ?? 'inventario'}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <InventarioTitulo {...(p.escaner ? { onEscanear: () => setEscaneando(true) } : {})} />
        {p.data.existencias.length === 0 ? (
          <SinProductos {...(p.onNuevoProducto ? { onNuevo: p.onNuevoProducto } : {})} />
        ) : (
          <ConProductos {...p} data={p.data} onAbrir={(it) => abrir(tipoAlAbrir(it), it.id)} />
        )}
      </ScrollView>
      <Hojas hoja={hoja} data={p.data} onGuardar={onGuardar} onClose={cerrar} />
      {p.escaner ? (
        <InventarioEscaner
          config={p.escaner}
          abierto={escaneando}
          onCerrar={() => setEscaneando(false)}
          existencias={p.data.existencias}
          dueno={p.dueno}
          hoja={vivo}
        />
      ) : null}
      {toast === null ? null : <MovToast x={toast} onClose={cerrarToast} />}
      {p.foto ? <FotoHojas flujo={p.foto} dueno={p.dueno} caja={p.data.caja} /> : null}
    </>
  );
}

export function InventarioScreen(p: InventarioScreenProps): ReactElement {
  // The route's identity testID rides every state — flows assert the
  // screen, not whichever branch the data left it in.
  if (p.state === 'error' || (p.state === 'happy' && p.data === null)) {
    return (
      <View flex={1} testID={p.testID}>
        <CajaEstado
          mode="error"
          errorTitle="No pudimos cargar el inventario"
          onRetry={p.onRetry}
          testID="inventario"
        />
      </View>
    );
  }
  if (p.data === null) {
    return (
      <View flex={1} testID={p.testID}>
        <EstadoCargando testID="inventario-cargando" />
      </View>
    );
  }
  return <Contenido {...p} data={p.data} />;
}

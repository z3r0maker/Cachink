/**
 * Cobrar (Track M, M-07; boards MvCobrar, TbCobrar, TbCobrarVertical): the
 * catalogue and the ticket in progress. On a phone the black bar opens the
 * ticket sheet; on a tablet the ticket sits beside the catalogue (landscape)
 * or docks under it (portrait), with the method chips, like the web caja.
 *
 * Presentation only: the route hands in the products, the ticket and the
 * actions; the sheets (ticket, escáner, producto nuevo) are the route's.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { useWindowDimensions } from 'react-native';
import { View } from '@tamagui/core';
import type { LineaTicket } from '@xangarro/caja/caja';
import { Btn } from '../../components/Btn/index';
import { MText } from '../../components/Mostrador/index';
import { Spinner } from '../../components/Spinner/index';
import { colors } from '../../theme';
import { useCajaLayout } from '../AppShell/use-caja-layout';
import type { MetodoCobro } from '../Checkout/cobro-logic';
import { CatalogoView } from './cobrar-catalogo-view';
import { categoriasDe, filtrarCatalogo, TODOS, type ProductoCobrar } from './cobrar-catalogo';
import { CobrarBar } from './cobrar-bar';
import { resumenTicket } from './ticket-en-curso';
import { TicketPanel } from './ticket-panel';

export interface CobrarScreenProps {
  readonly estado: 'cargando' | 'error' | 'listo';
  readonly onReintentar?: () => void;
  readonly productos: readonly ProductoCobrar[];
  readonly lines: readonly LineaTicket[];
  readonly folio: string | null;
  readonly metodos: readonly MetodoCobro[];
  readonly metodo: MetodoCobro;
  readonly onMetodo: (m: MetodoCobro) => void;
  readonly onAdd: (p: ProductoCobrar) => void;
  readonly onBump: (productoId: string, delta: number) => void;
  readonly onQuitar: (productoId: string) => void;
  readonly onVaciar: () => void;
  /** Phone: open the ticket sheet. */
  readonly onAbrirTicket: () => void;
  /** Tablet: straight to the cobro with the chosen method. */
  readonly onCobrar: () => void;
  readonly onFiado: () => void;
  readonly onEscanear: () => void;
  readonly onProductoNuevo: () => void;
  /** Stories only: the arrangement, instead of reading the window. */
  readonly disposicion?: Disposicion;
  readonly testID?: string;
}

/** Phone bar, tablet side panel (landscape) or tablet dock (portrait). */
export type Disposicion = 'telefono' | 'lado' | 'dock';

function useDisposicion(forzada: Disposicion | undefined): Disposicion {
  const layout = useCajaLayout();
  const { width, height } = useWindowDimensions();
  if (forzada) return forzada;
  if (layout === 'phone') return 'telefono';
  return width > height ? 'lado' : 'dock';
}

function useFiltro(productos: readonly ProductoCobrar[]) {
  const [categoria, setCategoria] = useState(TODOS);
  const [query, setQuery] = useState('');
  const categorias = useMemo(() => categoriasDe(productos), [productos]);
  const visibles = useMemo(
    () => filtrarCatalogo(productos, categorias.includes(categoria) ? categoria : TODOS, query),
    [productos, categorias, categoria, query],
  );
  // A search looks through everything, as the web caja's does.
  const buscar = (q: string): void => {
    setQuery(q);
    setCategoria(TODOS);
  };
  return { categoria, setCategoria, query, buscar, categorias, visibles };
}

function Estado(p: CobrarScreenProps): ReactElement {
  if (p.estado === 'cargando') {
    return (
      <View flex={1} alignItems="center" justifyContent="center" testID="cobrar-cargando">
        <Spinner />
      </View>
    );
  }
  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding={24}
      gap={12}
      testID="cobrar-error"
    >
      <MText size="lg" weight="extraBold" textAlign="center">
        No pudimos leer tus productos
      </MText>
      <MText weight="semibold" color={colors.gray600} textAlign="center">
        Tu venta no se pierde. Vuelve a intentarlo.
      </MText>
      {p.onReintentar ? (
        <Btn variant="secondary" size="lg" onPress={p.onReintentar}>
          Reintentar
        </Btn>
      ) : null}
    </View>
  );
}

export function CobrarScreen(p: CobrarScreenProps): ReactElement {
  const disp = useDisposicion(p.disposicion);
  const f = useFiltro(p.productos);
  const info = useMemo(() => new Map(p.productos.map((x) => [x.id, x])), [p.productos]);
  const cantidades = useMemo(
    () => new Map(p.lines.map((l) => [l.productoId, l.cantidad])),
    [p.lines],
  );
  if (p.estado !== 'listo') return <Estado {...p} />;
  const tableta = disp !== 'telefono';
  const lado = disp === 'lado';
  const catalogo = (
    <CatalogoView
      productos={f.visibles}
      categorias={f.categorias}
      categoria={f.categoria}
      onCategoria={f.setCategoria}
      query={f.query}
      onQuery={f.buscar}
      cantidades={cantidades}
      onAdd={p.onAdd}
      onEscanear={p.onEscanear}
      onProductoNuevo={p.onProductoNuevo}
      columnas={tableta ? (lado ? 4 : 3) : 2}
      hayCatalogo={p.productos.length > 0}
    />
  );
  const { piezas, total } = resumenTicket(p.lines);
  return (
    <View flex={1} flexDirection={lado ? 'row' : 'column'} testID={p.testID ?? 'cobrar-screen'}>
      {catalogo}
      {tableta ? (
        <TicketPanel modo={lado ? 'lado' : 'dock'} {...p} info={info} />
      ) : (
        <CobrarBar piezas={piezas} total={total} onVaciar={p.onVaciar} onCobrar={p.onAbrirTicket} />
      )}
    </View>
  );
}

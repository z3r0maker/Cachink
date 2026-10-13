/**
 * Ventas del turno (Track M, M-08; board MvVentas): what the operator cobró
 * since the turno opened — the three figures, the search, the method chips
 * and every sale, each opening its ticket in the sheet where it can be
 * shared or cancelled with a reason. Presentational: the route hands it
 * `useVentasTurno()` and the navigation; nothing here reads a database.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { ScrollView, View } from 'react-native';
import {
  DETALLE_CANCELADA,
  detalleDeFila,
  filtrar,
  marcarCancelada,
  avisoCancelada,
  ventaPorFolio,
  type CargaTicket,
  type VentasData,
  type VentaDetalle,
  type VentaTurno,
} from '@xangarro/caja/ventas';
import { Buscador, Cabecera, Filtros, NotaAmbar, type FiltroVenta } from './venta-controles';
import { CancelarVentaDialog } from './venta-cancelar';
import { VentaDetalleSheet } from './venta-detalle';
import { VentasEstados, type VentasEstado } from './venta-estados';
import { ListaVentas } from './venta-filas';
import { VentaResumen } from './venta-resumen';

export type { VentasEstado } from './venta-estados';

export interface VentasMostradorScreenProps {
  readonly state: VentasEstado;
  readonly data: VentasData | null;
  /** The owner's name (the amber note says it); «Pedro» until known. */
  readonly dueno?: string;
  readonly onRetry: () => void;
  /** The empty and sin-turno way forward. */
  readonly onIrACobrar: () => void;
  /** The phone's comprobante share for this ticket (the route owns it). */
  readonly onCompartir: (venta: VentaDetalle) => void;
  /** The fiado note's «Recibir un abono». */
  readonly onAbono?: () => void;
  /** Cancels through the ticket use case; resolves the error, or null. */
  readonly onCancelar: (venta: VentaTurno, motivo: string, pin: string) => Promise<string | null>;
  /** Loads the ticket the sheet opens; the fixture resolution when absent. */
  readonly cargarDetalle?: (folio: string, fila: VentaTurno | undefined) => Promise<CargaTicket>;
  /** Opens with this folio's sheet over the list (the web's `/ventas/[folio]`). */
  readonly abierta?: string;
  readonly testID?: string;
}

/** The fixture path: the priced tickets, the cancelled one, or the row itself. */
export function cargaDeFila(folio: string, fila: VentaTurno | undefined): CargaTicket {
  const fija =
    ventaPorFolio(folio) ?? (folio === DETALLE_CANCELADA.folio ? DETALLE_CANCELADA : null);
  const base = fija ?? (fila ? detalleDeFila(fila) : null);
  if (base === null) return { state: 'empty' };
  return { state: 'happy', venta: fila?.cancelada ? { ...base, cancelada: fila.cancelada } : base };
}

/** The ticket the sheet shows: the live loader's, or the fixture resolution. */
function useCarga(
  sel: string | null,
  fila: VentaTurno | undefined,
  cargarDetalle: VentasMostradorScreenProps['cargarDetalle'],
): CargaTicket {
  const [carga, setCarga] = useState<CargaTicket>({ state: 'loading' });
  useEffect(() => {
    if (sel === null) return;
    setCarga({ state: 'loading' });
    let vivo = true;
    const lector = cargarDetalle?.(sel, fila) ?? Promise.resolve(cargaDeFila(sel, fila));
    void lector.then((c) => {
      if (vivo) setCarga(c);
    });
    return () => {
      vivo = false;
    };
  }, [sel, fila, cargarDetalle]);
  return carga;
}

/** What a cancellation leaves on the list, and what the sheet says it did. */
function trasCancelar(fila: VentaTurno, motivo: string): { readonly aviso: string } {
  return { aviso: avisoCancelada(marcarCancelada([fila], fila.folio, motivo)[0] ?? fila) };
}

/** Which ticket is open and what covers it; the route may open one on arrival. */
function useCapas(abierta?: string) {
  const [sel, setSel] = useState<string | null>(abierta ?? null);
  const [cancelar, setCancelar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const abrir = (folio: string): void => {
    setSel(folio);
    setAviso(null);
  };
  return { sel, setSel, cerrar: () => setSel(null), cancelar, setCancelar, aviso, setAviso, abrir };
}

/** The list's view state: filters, what a cancellation marked, the open ticket. */
function useVista(p: VentasMostradorScreenProps, data: VentasData) {
  const [filtro, setFiltro] = useState<FiltroVenta>('Todos');
  const [query, setQuery] = useState('');
  // A cancellation's mark, not a snapshot: applied over whatever the route
  // re-reads, so a venta captured afterwards still reaches the list.
  const [marcas, setMarcas] = useState<ReadonlyMap<string, string> | null>(null);
  const capas = useCapas(p.abierta);
  const { onCancelar } = p;
  const ventas = useMemo(() => {
    if (marcas === null || marcas.size === 0) return data.ventas;
    return data.ventas.map((v) => {
      const motivo = marcas.get(v.folio);
      return motivo === undefined || v.cancelada !== undefined
        ? v
        : { ...v, cancelada: { motivo } };
    });
  }, [data.ventas, marcas]);
  const fila = useMemo(() => ventas.find((v) => v.folio === capas.sel), [ventas, capas.sel]);
  const carga = useCarga(capas.sel, fila, p.cargarDetalle);

  const confirmar = async (motivo: string, pin: string): Promise<string | null> => {
    if (!fila) return 'Venta no encontrada';
    const error = await onCancelar(fila, motivo, pin);
    if (error !== null) return error;
    setMarcas((prev) => new Map(prev ?? []).set(fila.folio, motivo));
    capas.setCancelar(false);
    capas.setAviso(trasCancelar(fila, motivo).aviso);
    // The dialog treats anything but null as its error branch (and would
    // reset to the PIN step with an empty message over the closed sheet).
    return null;
  };
  return { filtro, setFiltro, query, setQuery, ventas, fila, carga, confirmar, ...capas };
}

/** The drawer, and the cancel dialog it opens (each replaces it while open). */
function Capas(p: {
  readonly props: VentasMostradorScreenProps;
  readonly data: VentasData;
  readonly v: ReturnType<typeof useVista>;
}): ReactElement {
  const { data, v } = p;
  return (
    <>
      <VentaDetalleSheet
        open={v.sel !== null}
        folio={v.sel ?? ''}
        carga={v.carga}
        ctx={{ operador: data.operador, caja: data.caja, desde: data.desde }}
        aviso={v.aviso}
        cancelable={v.fila !== undefined}
        onClose={v.cerrar}
        onCompartir={p.props.onCompartir}
        onCancelar={() => v.setCancelar(true)}
        onAbono={p.props.onAbono}
      />
      {v.cancelar && v.fila ? (
        <CancelarVentaDialog
          venta={v.fila}
          dueno={p.props.dueno}
          onClose={() => v.setCancelar(false)}
          onConfirm={v.confirmar}
        />
      ) : null}
    </>
  );
}

function Contenido(p: VentasMostradorScreenProps & { readonly data: VentasData }): ReactElement {
  const v = useVista(p, p.data);
  const ctx = { operador: p.data.operador, caja: p.data.caja };
  return (
    <>
      <ScrollView testID={p.testID ?? 'ventas'} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Cabecera desde={p.data.desde} />
        <VentaResumen ventas={v.ventas} desde={p.data.desde} />
        <Buscador q={v.query} onQ={v.setQuery} />
        <Filtros filtro={v.filtro} onFiltro={v.setFiltro} />
        <ListaVentas ventas={filtrar(v.ventas, v.filtro, v.query)} ctx={ctx} onAbrir={v.abrir} />
        <NotaAmbar dueno={p.dueno ?? 'Pedro'} />
      </ScrollView>
      <Capas props={p} data={p.data} v={v} />
    </>
  );
}

export function VentasMostradorScreen(p: VentasMostradorScreenProps): ReactElement {
  if (p.state !== 'happy' || p.data === null) {
    const id = p.state === 'happy' ? 'loading' : p.state;
    // The route's identity testID rides every state — flows assert the
    // screen, not whichever branch the turno left it in.
    return (
      <View style={{ flex: 1 }} testID={p.testID}>
        <VentasEstados id={id} onRetry={p.onRetry} onIrACobrar={p.onIrACobrar} />
      </View>
    );
  }
  return <Contenido {...p} data={p.data} />;
}

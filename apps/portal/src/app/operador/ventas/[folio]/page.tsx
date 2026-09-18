import { DETALLE_VENTAS, detalleFixture, ventaPorFolio } from '@/operador/ventas/detalle/fixture';
import { DetalleScreen } from '@/operador/ventas/detalle/screen';
import type { DetalleScreenProps, VentaDetalle } from '@/operador/ventas/detalle/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

type Query = Readonly<Record<'dataState' | 'venta' | 'estado', string | undefined>>;

/**
 * Development-only forcing of the design's `dataState`, `?venta=efectivo|fiado`
 * and `?estado=cancelada` (ADR-058 §9); in production the folio alone decides.
 */
function forced(
  q: Query,
  folio: string,
): { state: DetalleScreenProps['state']; venta: VentaDetalle | null } {
  const venta = ventaPorFolio(folio);
  if (process.env.NODE_ENV === 'production') return { state: 'happy', venta };
  const elegida = q.venta === 'efectivo' || q.venta === 'fiado' ? DETALLE_VENTAS[q.venta] : venta;
  return {
    state: STATES.find((s) => s === q.dataState) ?? 'happy',
    venta:
      elegida && q.estado === 'cancelada'
        ? { ...elegida, cancelada: { motivo: 'Error de captura' } }
        : elegida,
  };
}

/** Operador · Detalle de venta (O-22). Fixture data until the register runtime (O-06). */
export default async function OperadorDetalleVentaPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly folio: string }>;
  readonly searchParams: Promise<Query>;
}) {
  const { folio } = await params;
  const { state, venta } = forced(await searchParams, decodeURIComponent(folio));
  return <DetalleScreen state={state} data={detalleFixture(venta)} />;
}

import { DETALLE_VENTAS, detalleFixture, ventaPorFolio } from '@/operador/ventas/detalle/fixture';
import { DetalleVentaViva } from '@/operador/ventas/detalle/viva';
import type { DetalleScreenProps, VentaDetalle } from '@/operador/ventas/detalle/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

type Query = Readonly<Record<'dataState' | 'venta' | 'estado' | 'enCola', string | undefined>>;

/**
 * Development-only forcing of the design's `dataState`, `?venta=efectivo|fiado`,
 * `?estado=cancelada` and `?enCola=true` (ADR-058 §9); in production the folio
 * alone decides.
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
    venta: elegida && {
      ...elegida,
      ...(q.estado === 'cancelada' ? { cancelada: { motivo: 'Error de captura' } } : {}),
      ...(q.enCola === 'true' ? { enCola: true } : {}),
    },
  };
}

/**
 * Operador · Detalle de venta (O-22, real data O-34). Fixtures for an
 * unlinked browser; a linked register reads the turno's ticket by folio.
 */
export default async function OperadorDetalleVentaPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly folio: string }>;
  readonly searchParams: Promise<Query>;
}) {
  const { folio } = await params;
  const { state, venta } = forced(await searchParams, decodeURIComponent(folio));
  return (
    <DetalleVentaViva
      folio={decodeURIComponent(folio)}
      forzado={state}
      fixture={{ state, data: detalleFixture(venta) }}
    />
  );
}

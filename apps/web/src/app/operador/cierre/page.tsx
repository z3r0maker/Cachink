import { resumen as resumenInventario, INVENTARIO_FIXTURE } from '@xangarro/caja/inventario';
import { CierreViva } from '@/operador/cierre/viva';
import type { CierreData, CierreScreenProps } from '@xangarro/caja/cierre';
import { TURNO_FIXTURE as T } from '@xangarro/caja/turno';
import { VENTAS_FIXTURE } from '@xangarro/caja/ventas';
import { sum } from '@xangarro/domain';
import { SHELL_FIXTURE } from '@xangarro/caja';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9); `connection` is the shell's. */
function forced(dataState: string | undefined): CierreScreenProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/**
 * The close reads the same turno as Inicio and Turno: the four parts of the
 * expected cash from Turno, cancellations from Ventas, movements from
 * Inventario. Fixtures until the register runtime (O-06).
 */
function datos(): CierreData {
  const canceladas = VENTAS_FIXTURE.ventas.filter((v) => v.cancelada);
  const inv = resumenInventario(INVENTARIO_FIXTURE.existencias, INVENTARIO_FIXTURE.movimientos);
  return {
    operador: T.operador,
    caja: T.caja,
    desde: T.desde,
    hasta: '21:04',
    dueno: 'Pedro',
    negocio: SHELL_FIXTURE.negocio.nombre,
    partes: T,
    resumen: {
      ventas: T.ventas,
      cobrado: T.cobrado,
      canceladas: canceladas.length,
      cancelado: sum(canceladas.map((v) => v.monto)),
      ...(canceladas.length === 1 && canceladas[0] ? { canceladaHora: canceladas[0].hora } : {}),
      fiado: T.fiado,
      entradas: inv.entradas,
      mermas: inv.mermas,
    },
    conteo: {},
  };
}

/** Operador · Cierre de turno (O-28, real data O-36). */
export default async function OperadorCierrePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return (
    <CierreViva fixture={{ state: forced(dataState), data: datos() }} forzado={forced(dataState)} />
  );
}

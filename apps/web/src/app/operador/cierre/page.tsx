import { resumen as resumenInventario } from '@/operador/inventario/derive';
import { INVENTARIO_FIXTURE } from '@/operador/inventario/fixture';
import { CierreScreen } from '@/operador/cierre/screen';
import type { CierreData, CierreScreenProps } from '@/operador/cierre/types';
import { TURNO_FIXTURE as T } from '@/operador/turno/fixture';
import { VENTAS_FIXTURE } from '@/operador/ventas/fixture';
import { sum } from '@xangarro/domain';

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
    partes: T,
    resumen: {
      ventas: T.ventas,
      cobrado: T.cobrado,
      canceladas: canceladas.length,
      cancelado: sum(canceladas.map((v) => v.monto)),
      fiado: T.fiado,
      entradas: inv.entradas,
      mermas: inv.mermas,
    },
    conteo: { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 },
  };
}

/** Operador · Cierre de turno (O-28). */
export default async function OperadorCierrePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { dataState } = await searchParams;
  return <CierreScreen state={forced(dataState)} data={datos()} />;
}

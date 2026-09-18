import { cuentaPorId } from '@/operador/cobranza/cuentas';
import { DetalleClienteScreen } from '@/operador/cobranza/cliente/screen';
import type { DetalleClienteProps } from '@/operador/cobranza/cliente/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9). */
function forced(dataState: string | undefined): DetalleClienteProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/**
 * Operador · Detalle de cliente (O-26). Fixture accounts until the register
 * runtime (O-06); a client without one gets the empty state.
 */
export default async function OperadorDetalleClientePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly cliente: string }>;
  readonly searchParams: Promise<{ readonly dataState?: string }>;
}) {
  const { cliente } = await params;
  const { dataState } = await searchParams;
  const cuenta = cuentaPorId(cliente);
  return (
    <DetalleClienteScreen
      state={forced(dataState)}
      data={{ negocio: 'Taquería Don Pedro', dueno: 'Pedro', cuenta }}
    />
  );
}

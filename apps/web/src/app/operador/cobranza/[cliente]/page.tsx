import { cuentaPorId } from '@/operador/cobranza/cuentas';
import { HOY } from '@/operador/fixtures';
import { DetalleClienteViva } from '@/operador/cobranza/cliente/viva';
import type { DetalleClienteProps } from '@/operador/cobranza/cliente/types';

const STATES = ['happy', 'loading', 'empty', 'error'] as const;

/** Development-only forcing of the design's `dataState` (ADR-058 §9). */
function forced(dataState: string | undefined): DetalleClienteProps['state'] {
  if (process.env.NODE_ENV === 'production') return 'happy';
  return STATES.find((s) => s === dataState) ?? 'happy';
}

/**
 * Operador · Detalle de cliente (O-26, real data O-33). Fixture accounts for
 * an unlinked browser; a linked register reads its own database.
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
  return (
    <DetalleClienteViva
      clienteId={cliente}
      forzado={forced(dataState)}
      fixture={{
        negocio: 'Taquería Don Pedro',
        hoy: HOY,
        dueno: 'Pedro',
        cuenta: cuentaPorId(cliente),
      }}
    />
  );
}

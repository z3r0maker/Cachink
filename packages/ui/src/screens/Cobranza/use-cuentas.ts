/**
 * The phone's credit accounts (Track M, M-08), read once and shared: Fiado y
 * abonos and a client's detail say them as `CuentaCliente` (`comoCuenta`,
 * the web's own mapper), Inicio sums «Por cobrar» and lists «Cobrar a …».
 * Keyed under `cobrar`, so a sale (fiado included) and an abono refresh it.
 */
import { useCallback, useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { comoCuenta, type CuentaCliente } from '@xangarro/caja/cobranza/vivo';
import type { CuentaPara } from '@xangarro/caja/lectura';
import type { BusinessId } from '@xangarro/domain';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/index';
import { leerCuentas } from './cuentas-lectura';

export const cobranzaKeys = {
  cuentas: (b: BusinessId | null) => ['cobrar', 'cuentas', b] as const,
};

/** The raw accounts (`CuentaPara`), as the web Worker hands them to its screens. */
export function useCuentasPara(): UseQueryResult<readonly CuentaPara[], Error> {
  const repos = useRepositories();
  const businessId = useCurrentBusinessId();
  return useQuery({
    queryKey: cobranzaKeys.cuentas(businessId),
    enabled: businessId !== null,
    queryFn: () => leerCuentas(repos, businessId as BusinessId),
  });
}

export interface CuentasVivas {
  readonly state: 'loading' | 'error' | 'happy';
  readonly cuentas: readonly CuentaCliente[];
  /** The day abonos count as «hoy» and debts are aged against. */
  readonly hoy: string;
  readonly refetch: () => void;
}

/** The accounts as the screens read them, sorted by name. */
export function useCuentas(): CuentasVivas {
  const q = useCuentasPara();
  const hoy = hoyLocal();
  const cuentas = useMemo(
    () =>
      (q.data ?? [])
        .map((c) => comoCuenta(c, hoy))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX')),
    [q.data, hoy],
  );
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  const state = q.isError ? 'error' : q.data === undefined ? 'loading' : 'happy';
  return { state, cuentas, hoy, refetch: recargar };
}

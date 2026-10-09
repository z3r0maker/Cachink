/**
 * `useInventario` — Inventario's data (Track M, M-09): the stocked products
 * with their count and this turno's movements, keyed under the caja's
 * queries so a venta or a turno refreshes them, with the session's names
 * around them.
 *
 * Registering a move mirrors the web operador's `moverInventario`: the
 * screen's kind and words through `movimientoDominio` (whole quantities
 * only, the motivo the domain expects), at the product's cost, through
 * `RegistrarMovimientoInventarioUseCase` — which also records the purchase
 * expense an entrada implies.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { movimientoDominio } from '@xangarro/caja/lectura';
import {
  comoInventario,
  type InventarioData,
  type NuevoMovimientoVivo,
} from '@xangarro/caja/inventario';
import type { BusinessId, DeviceId, ProductId, UserId } from '@xangarro/domain';
import { useRepositories, type Repositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useDeviceId, useUserId } from '../../app-config/use-app-config';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import { cajaKeys } from '../../hooks/query-keys';
import { useTranslation } from '../../i18n/index';
import { useShellData } from '../AppShell/use-shell-data';
import { leerFilasInventario } from './inventario-lectura';

export interface InventarioVivo {
  readonly state: 'loading' | 'error' | 'happy';
  readonly data: InventarioData | null;
  /** The owner's first name, for the empty answer and the regla note. */
  readonly dueno: string;
  readonly registrar: (m: NuevoMovimientoVivo) => Promise<void>;
  readonly refetch: () => void;
}

export function inventarioKey(
  businessId: BusinessId | null,
  userId: UserId | null,
  deviceId: DeviceId | null,
): readonly unknown[] {
  return [...cajaKeys.byBusiness(businessId), 'inventario', userId, deviceId];
}

/** The move as the domain records it, at the product's cost (the web's write). */
function nuevoMovimiento(
  m: NuevoMovimientoVivo,
  costoUnitCentavos: bigint,
  businessId: BusinessId,
) {
  return {
    ...movimientoDominio(m.tipo, m.cantidad, m.detalle),
    productoId: m.existenciaId as ProductId,
    fecha: hoyLocal() as never,
    costoUnitCentavos,
    origen: 'manual' as const,
    businessId,
  };
}

/** The web's `moverInventario`: the product's cost, through the use case. */
async function moverEnCatalogo(
  products: Pick<Repositories['products'], 'findById'>,
  mover: ReturnType<typeof useRegistrarMovimiento>,
  businessId: BusinessId,
  m: NuevoMovimientoVivo,
): Promise<void> {
  const producto = await products.findById(m.existenciaId as ProductId);
  if (producto === null) throw new Error('Ese producto ya no está en el catálogo');
  await mover.mutateAsync(nuevoMovimiento(m, producto.costoUnitCentavos, businessId));
}

/** The screen's data once the read and the session both land, or null. */
function comoData(
  filas: Awaited<ReturnType<typeof leerFilasInventario>> | undefined,
  shell: ReturnType<typeof useShellData>,
  cajaSinNombre: string,
): InventarioData | null {
  if (filas === undefined || shell.operador === null) return null;
  return {
    ...comoInventario(filas.inventario, shell.operador),
    caja: shell.caja ?? cajaSinNombre,
  };
}

/** The screen's read as a query: keyed off the caja, off until the ids land. */
function consulta(
  repos: Repositories,
  ctx: {
    readonly businessId: BusinessId | null;
    readonly userId: UserId | null;
    readonly deviceId: DeviceId | null;
    readonly hoy: string;
  },
) {
  const { businessId, userId, deviceId, hoy } = ctx;
  return {
    queryKey: [...inventarioKey(businessId, userId, deviceId), hoy],
    queryFn: () =>
      leerFilasInventario(
        repos,
        businessId as BusinessId,
        userId as UserId,
        deviceId as DeviceId,
        hoy,
      ),
    enabled: businessId !== null && userId !== null && deviceId !== null,
  };
}

export function useInventario(): InventarioVivo {
  const { t } = useTranslation();
  const repos = useRepositories();
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const userId = useUserId();
  const deviceId = useDeviceId();
  const shell = useShellData();
  const mover = useRegistrarMovimiento();
  const queryClient = useQueryClient();
  const hoy = hoyLocal();
  const q = useQuery(consulta(repos, { businessId, userId, deviceId, hoy }));
  const registrar = useCallback(
    async (m: NuevoMovimientoVivo): Promise<void> => {
      if (businessId === null) throw new Error('No hay negocio en esta caja');
      await moverEnCatalogo(repos.products, mover, businessId, m);
      await queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
    },
    [businessId, mover, queryClient, repos.products],
  );
  const data = comoData(q.data, shell, t('shell.cajaSinNombre'));
  const state = q.isError ? 'error' : data === null ? 'loading' : 'happy';
  const { refetch } = q;
  const recargar = useCallback(() => void refetch(), [refetch]);
  return {
    state,
    data,
    dueno: q.data?.dueno ?? 'el dueño',
    registrar,
    refetch: recargar,
  };
}

/**
 * Inventario's data on the phone: the read (`leerInventario`) keyed under
 * the movements, so a new entrada or merma refreshes it, and the write
 * through `useRegistrarMovimiento` (`RegistrarMovimientoInventarioUseCase`,
 * with the plan quota and the audit log): the screen's move becomes the
 * domain's tipo + motivo with `movimientoDominio` (an entrada is a «Compra a
 * proveedor» and records its purchase gasto; a merma is a salida for «Merma /
 * daño»), at the product's cost, from this device (`manual`).
 */
import { useQuery } from '@tanstack/react-query';
import { hoyLocal } from '@xangarro/caja';
import { movimientoDominio } from '@xangarro/caja/lectura';
import type { BusinessId, IsoDate, UserId } from '@xangarro/domain';
import { useRepositories } from '../../app/repository-provider';
import { useCurrentBusinessId, useDeviceId, useUserId } from '../../app-config/use-app-config';
import { useFeatureFlag } from '../../hooks/use-feature-flags';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import { leerInventario, type ExistenciaMovil, type InventarioLeido } from './inventario-lectura';
import { detalle, type Borrador } from './mover-logica';
import { useSnapshotPendiente } from './use-snapshot-pendiente';

export interface InventarioCaja {
  readonly state: 'loading' | 'error' | 'empty' | 'happy';
  readonly data: InventarioLeido;
  /** The plan carries no stock (A-14): nothing to count here. */
  readonly sinInventario: boolean;
  readonly registrando: boolean;
  readonly registrar: (b: Borrador, e: ExistenciaMovil) => Promise<void>;
  readonly refetch: () => void;
  /** The first download is still open (DS-10): «Terminando de descargar el inventario…». */
  readonly bajando: boolean;
}

const VACIO: InventarioLeido = { existencias: [], movimientos: [] };

function useLectura(businessId: BusinessId | null, hoy: string) {
  const repos = useRepositories();
  const userId = useUserId() as UserId | null;
  const deviceId = useDeviceId();
  return useQuery({
    queryKey: ['movimientos', businessId, 'inventario-caja', userId, hoy],
    queryFn: () =>
      leerInventario(repos, {
        businessId: businessId as BusinessId,
        userId: userId as UserId,
        deviceId: deviceId as string,
        hoy,
      }),
    enabled: businessId !== null && userId !== null && deviceId !== null,
  });
}

function estadoDe(error: boolean, data: InventarioLeido | undefined): InventarioCaja['state'] {
  if (error) return 'error';
  if (data === undefined) return 'loading';
  return data.existencias.length === 0 ? 'empty' : 'happy';
}

export function useInventarioCaja(): InventarioCaja {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const stockOn = useFeatureFlag('stock');
  const hoy = hoyLocal();
  const q = useLectura(businessId, hoy);
  const mover = useRegistrarMovimiento();
  const registrar = async (b: Borrador, e: ExistenciaMovil): Promise<void> => {
    await mover.mutateAsync({
      ...movimientoDominio(b.tipo, b.cantidad, detalle(b)),
      productoId: e.id as never,
      fecha: hoy as IsoDate,
      costoUnitCentavos: e.costoUnitCentavos,
      origen: 'manual',
      businessId: businessId as BusinessId,
    });
  };
  const bajando = useSnapshotPendiente();
  return {
    state: stockOn ? estadoDe(q.isError, q.data) : 'empty',
    data: q.data ?? VACIO,
    sinInventario: !stockOn,
    registrando: mover.isPending,
    registrar,
    refetch: () => void q.refetch(),
    bajando,
  };
}

/**
 * Expo Router entry for /merma — shrinkage tracking tab.
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders the MermaScreen and wires the mutation via
 * `useRegistrarMovimiento` with tipo='salida' and motivo='Merma / daño'.
 */

import type { ReactElement } from 'react';
import {
  MermaScreen,
  useProductos,
  useRegistrarMovimiento,
  useCurrentBusinessId,
} from '@cachink/ui';
import type { BusinessId, IsoDate, ProductId } from '@cachink/domain';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export default function MermaRoute(): ReactElement {
  const productosQ = useProductos();
  const registrar = useRegistrarMovimiento();
  const businessId = useCurrentBusinessId();

  function handleRegisterMerma(
    productoId: string,
    cantidad: number,
    reason: string,
    nota: string | null,
  ): void {
    if (!businessId) return;
    registrar.mutate({
      productoId: productoId as ProductId,
      fecha: todayIso(),
      tipo: 'salida',
      cantidad,
      costoUnitCentavos: 0n,
      motivo: 'Merma / daño',
      nota: nota ? `${reason}: ${nota}` : reason,
      businessId: businessId as BusinessId,
    });
  }

  return (
    <MermaScreen
      productos={productosQ.data ?? []}
      onRegisterMerma={handleRegisterMerma}
      submitting={registrar.isPending}
      testID="merma-route"
    />
  );
}

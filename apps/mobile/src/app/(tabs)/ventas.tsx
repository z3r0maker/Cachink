/**
 * Expo Router entry for /ventas (Track M, M-08; board MvVentas): the turno's
 * sales with the sale sheet — detail, comprobante share and cancel-with-
 * reason; never edited or deleted (Track M decision of 2026-09-27).
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  ComprobanteSheet,
  useCurrentBusiness,
  useVentasTurno,
  ventaHechaDeDetalle,
  VentasMostradorScreen,
  type VentaDetalle,
} from '@xangarro/ui';

export default function VentasTabRoute(): ReactElement {
  const router = useRouter();
  const v = useVentasTurno();
  const business = useCurrentBusiness().data ?? null;
  const [comprobante, setComprobante] = useState<VentaDetalle | null>(null);
  const cerrar = (): void => setComprobante(null);
  return (
    <>
      <VentasMostradorScreen
        testID="mobile-ventas"
        state={v.state}
        data={v.data}
        dueno={v.dueno ?? undefined}
        onRetry={v.refetch}
        onIrACobrar={() => router.navigate('/cobrar' as never)}
        onCompartir={(venta) => setComprobante(venta)}
        onAbono={() => router.navigate('/fiado' as never)}
        onCancelar={v.cancelar}
        cargarDetalle={v.cargarDetalle}
      />
      {comprobante ? (
        <ComprobanteSheet
          open
          venta={ventaHechaDeDetalle(comprobante)}
          business={business}
          onClose={cerrar}
          onNueva={cerrar}
        />
      ) : null}
    </>
  );
}

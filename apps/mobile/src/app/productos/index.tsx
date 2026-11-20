/**
 * Expo Router entry for /productos (Track M, M-09; board MvInventario):
 * existencias and the turno's movements, with «Llegó mercancía» and «Merma»
 * as sheets — product management stays the owner's (Track M decision of
 * 2026-09-27); each product's square takes its photo (M-13). `?reponer=<productId>` — Inicio's «Para hoy» — opens the
 * llegada sheet on that product. With no products yet, «Producto nuevo»
 * opens the quick add (RvInventario). «Escanear» opens the escáner one
 * product at a time onto its movement (M-20, EcInventario). A stack route opened from Inicio and
 * Mi turno, so it wears the frame with the way back.
 */

import type { ReactElement } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  InventarioScreen,
  useEscanerInventario,
  useFotoFlujo,
  useInventario,
  useTranslation,
} from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';

export default function ProductosRoute(): ReactElement {
  const { t } = useTranslation();
  const router = useRouter();
  const back = useBackTo('/turno');
  const inv = useInventario();
  const foto = useFotoFlujo();
  const escaner = useEscanerInventario(inv.refetch);
  const { reponer } = useLocalSearchParams<{ reponer?: string }>();
  return (
    <AppShellWrapper title={t('shell.nav.inventario')} onBack={back}>
      <InventarioScreen
        testID="mobile-inventario"
        state={inv.state}
        data={inv.data}
        dueno={inv.dueno}
        reponer={reponer ?? null}
        registrar={inv.registrar}
        onNuevoProducto={() => router.push('/nuevo-producto' as never)}
        foto={foto}
        escaner={escaner}
        onRetry={inv.refetch}
      />
    </AppShellWrapper>
  );
}

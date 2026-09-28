/**
 * Expo Router entry for /inventario, «Inventario» (MvInventario; Track M,
 * M-09): what there is and what moved in the turno, with «Llegó mercancía»
 * and the merma in a sheet. Opened from Mi turno, Inicio and the rail; a
 * stack route with the way back to Mi turno. `?reponer=<id>` (Inicio's
 * «Reponer») opens that product's «Llegó mercancía»; `?producto=<id>` opens
 * its sheet (the old /productos/<id>).
 */
import { useCallback, type ReactElement } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { InventarioScreen, useDueno, useInventarioCaja } from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../shell/app-shell-wrapper';

function abrirDe(p: { reponer?: string; producto?: string }) {
  if (p.reponer) return { id: p.reponer, tipo: 'Entrada' as const };
  if (p.producto) return { id: p.producto };
  return null;
}

export default function InventarioRoute(): ReactElement {
  const back = useBackTo('/turno');
  const params = useLocalSearchParams<{ reponer?: string; producto?: string }>();
  const dueno = useDueno();
  const inv = useInventarioCaja();
  const { refetch } = inv;
  useFocusEffect(useCallback(() => refetch(), [refetch]));
  return (
    <AppShellWrapper title="Mi turno" backLabel="Volver a Mi turno" onBack={back}>
      <InventarioScreen
        state={inv.state}
        data={inv.data}
        sinInventario={inv.sinInventario}
        dueno={dueno}
        registrando={inv.registrando}
        onRegistrar={inv.registrar}
        onRetry={refetch}
        abrir={abrirDe(params)}
      />
    </AppShellWrapper>
  );
}

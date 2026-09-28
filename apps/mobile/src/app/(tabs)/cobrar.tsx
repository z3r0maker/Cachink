/**
 * Expo Router entry for /cobrar (Track M, M-07; boards MvCobrar, MvTicket,
 * MvEscaner, MvProductoNuevo, MvVentaHecha, TbCobrar, TbCobrarVertical): the
 * catalogue and the ticket in progress, with the escáner and producto nuevo
 * as sheets. Payment runs in /checkout; «Venta hecha» shows here when it
 * closes. With no open turno the caja gate says to open one.
 *
 * State in _cobrar-hooks.ts; sheets and dialogs in _cobrar-overlays.tsx.
 */
import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CajaGateBanner, CobrarScreen } from '@xangarro/ui';
import { useCatalogoCobrar, useCobrarContexto, useCobrarRuta } from './_cobrar-hooks';
import { CobrarOverlays } from './_cobrar-overlays';

export default function CobrarRoute(): ReactElement {
  const router = useRouter();
  const c = useCatalogoCobrar();
  const x = useCobrarContexto();
  const r = useCobrarRuta();
  if (!x.turno.isLoading && x.turno.openTurno === null) {
    return <CajaGateBanner onGoToCaja={() => router.navigate('/turno' as never)} />;
  }
  return (
    <View style={{ flex: 1 }}>
      <CobrarScreen
        estado={c.estado}
        onReintentar={c.reintentar}
        productos={c.productos}
        lines={r.ticket.lines}
        folio={x.folio}
        metodos={x.metodos}
        metodo={r.metodo}
        onMetodo={r.setMetodo}
        onAdd={r.agregar}
        onBump={r.ticket.bump}
        onQuitar={r.ticket.quitar}
        onVaciar={r.ticket.vaciar}
        onAbrirTicket={() => r.setHoja('ticket')}
        onCobrar={() => r.alCobro(r.metodo)}
        onFiado={() => r.alCobro('Fiado')}
        onEscanear={() => r.setHoja('escaner')}
        onProductoNuevo={() => r.abrirNuevo(null)}
      />
      <CobrarOverlays
        r={r}
        productos={c.productos}
        tipos={c.tipos}
        folio={x.folio}
        dueno={x.dueno}
      />
    </View>
  );
}

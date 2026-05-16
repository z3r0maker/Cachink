/**
 * Expo Router entry for /checkout/efectivo — cash numpad checkout.
 *
 * Reads the cart total from useCheckoutStore. On confirm, records
 * all cart items as sales with efectivoRecibidoCentavos, clears
 * the cart, pops back, and shows the Cachink burst.
 */

import { useCallback, useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Alert } from 'react-native';
import type { Money, PaymentMethod, Product, IsoDate } from '@cachink/domain';
import { today } from '@cachink/domain';
import {
  CachinkBurst,
  CheckoutEfectivo,
  buildQuickSellPayload,
  useCachinkSound,
  useCheckoutStore,
  useCurrentBusiness,
  useEfectivoEsperado,
  useProductosParaVenta,
  useRegistrarVenta,
} from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function CheckoutEfectivoRoute(): ReactElement {
  const router = useRouter();
  const cart = useCheckoutStore((s) => s.cart);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const registrar = useRegistrarVenta();
  const business = useCurrentBusiness().data ?? null;
  const productosQ = useProductosParaVenta();
  const [showCachink, setShowCachink] = useState(false);
  const fecha = today() as IsoDate;
  const efectivoQ = useEfectivoEsperado({ fecha });
  const efectivoEnCaja = efectivoQ.data?.esperado ?? null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cachinkPlayer = useAudioPlayer(require('../../../assets/sounds/cachink.mp3'));
  const { play: playCachink } = useCachinkSound(cachinkPlayer);

  const handleConfirm = useCallback(
    async (efectivoRecibido: Money) => {
      if (!business || !cart) {
        Alert.alert('Error', 'Negocio no configurado');
        return;
      }
      const products = productosQ.data ?? [];
      for (const item of cart.items) {
        const producto = products.find(
          (p: Product) => p.id === item.productoId,
        );
        if (!producto) continue;
        const payload = buildQuickSellPayload({
          producto,
          business,
          fecha,
          metodo: 'Efectivo' as PaymentMethod,
        });
        try {
          await registrar.mutateAsync({
            ...payload,
            cantidad: item.cantidad,
            efectivoRecibidoCentavos: efectivoRecibido,
          });
        } catch (err) {
          const msg = (err as Error).message;
          if (msg.includes('no column named')) {
            Alert.alert(
              'Actualización necesaria',
              'Cierra y vuelve a abrir la app para aplicar una actualización de la base de datos.',
            );
          } else {
            Alert.alert('Error', msg);
          }
          return;
        }
      }
      clearCheckout();
      setShowCachink(true);
      playCachink();
      // Pop back to ventas after burst
      setTimeout(() => router.dismissAll(), 600);
    },
    [business, cart, productosQ.data, fecha, registrar, clearCheckout, playCachink, router],
  );

  return (
    <AppShellWrapper
      activeTabKey="ventas"
      title={`Cobrar`}
      onBack={() => router.back()}
    >
      <CheckoutEfectivo
        totalCentavos={cart?.totalCentavos ?? 0n}
        onConfirm={handleConfirm}
        submitting={registrar.isPending}
        efectivoEnCaja={efectivoEnCaja}
      />
      <CachinkBurst
        visible={showCachink}
        onComplete={() => setShowCachink(false)}
        testID="cachink-burst-efectivo"
      />
    </AppShellWrapper>
  );
}

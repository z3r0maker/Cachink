/**
 * Expo Router entry for /checkout/confirm — card/transfer/QR confirmation.
 *
 * Reads `metodo` from query params. On confirm, records all cart items,
 * clears checkout, pops back, shows Cachink burst.
 */

import { useCallback, useState, type ReactElement } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Alert } from 'react-native';
import type { IsoDate, Money, PaymentMethod, Product } from '@cachink/domain';
import { today } from '@cachink/domain';
import {
  CachinkBurst,
  CheckoutConfirm,
  buildQuickSellPayload,
  useCachinkSound,
  useCheckoutStore,
  useCurrentBusiness,
  useProductosParaVenta,
  useRegistrarVenta,
} from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function CheckoutConfirmRoute(): ReactElement {
  const router = useRouter();
  const { metodo } = useLocalSearchParams<{ metodo: string }>();
  const cart = useCheckoutStore((s) => s.cart);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const registrar = useRegistrarVenta();
  const business = useCurrentBusiness().data ?? null;
  const productosQ = useProductosParaVenta();
  const [showCachink, setShowCachink] = useState(false);
  const fecha = today() as IsoDate;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cachinkPlayer = useAudioPlayer(require('../../../assets/sounds/cachink.mp3'));
  const { play: playCachink } = useCachinkSound(cachinkPlayer);

  const resolvedMetodo = (metodo ?? 'Tarjeta') as PaymentMethod;

  const handleConfirm = useCallback(async () => {
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
        metodo: resolvedMetodo,
      });
      try {
        await registrar.mutateAsync({
          ...payload,
          cantidad: item.cantidad,
        });
      } catch (err) {
        Alert.alert('Error', (err as Error).message);
        return;
      }
    }
    clearCheckout();
    setShowCachink(true);
    playCachink();
    setTimeout(() => router.dismissAll(), 600);
  }, [business, cart, productosQ.data, fecha, resolvedMetodo, registrar, clearCheckout, playCachink, router]);

  return (
    <AppShellWrapper
      activeTabKey="ventas"
      onBack={() => router.back()}
    >
      <CheckoutConfirm
        totalCentavos={cart?.totalCentavos ?? 0n}
        metodo={resolvedMetodo}
        onConfirm={handleConfirm}
        submitting={registrar.isPending}
      />
      <CachinkBurst
        visible={showCachink}
        onComplete={() => setShowCachink(false)}
        testID="cachink-burst-confirm"
      />
    </AppShellWrapper>
  );
}

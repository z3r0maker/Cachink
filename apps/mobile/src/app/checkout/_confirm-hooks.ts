/**
 * Hooks for /checkout/confirm — extracted to keep the route ≤ 40 lines.
 * Underscore prefix → Expo Router ignores this file.
 */

import { useCallback, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import type { Business, IsoDate, PaymentMethod, Product } from '@cachink/domain';
import { today } from '@cachink/domain';
import {
  buildQuickSellPayload,
  useCachinkSound,
  useCheckoutStore,
  useCurrentBusiness,
  useProductosParaVenta,
  useRegistrarVenta,
  type CartState,
} from '@cachink/ui';
import { useCachinkPlayer } from '../../shell/use-cachink-player';

export interface ConfirmState {
  metodo: PaymentMethod;
  totalCentavos: bigint;
  submitting: boolean;
  showCachink: boolean;
  setShowCachink: (v: boolean) => void;
  handleConfirm: () => Promise<void>;
}

function useConfirmDeps(): {
  router: ReturnType<typeof useRouter>;
  metodo: PaymentMethod;
  cart: CartState | null;
  clearCheckout: () => void;
  registrar: ReturnType<typeof useRegistrarVenta>;
  business: Business | null;
  productos: readonly Product[] | undefined;
  fecha: IsoDate;
  playCachink: () => void;
} {
  const router = useRouter();
  const { metodo } = useLocalSearchParams<{ metodo: string }>();
  const cart = useCheckoutStore((s) => s.cart);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const registrar = useRegistrarVenta();
  const business = useCurrentBusiness().data ?? null;
  const productos = useProductosParaVenta().data;
  const cachinkPlayer = useCachinkPlayer();
  const { play: playCachink } = useCachinkSound(cachinkPlayer);
  return {
    router, metodo: (metodo ?? 'Tarjeta') as PaymentMethod,
    cart, clearCheckout, registrar, business,
    productos, fecha: today() as IsoDate, playCachink,
  };
}

export function useConfirmState(): ConfirmState {
  const d = useConfirmDeps();
  const [showCachink, setShowCachink] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!d.business || !d.cart) {
      Alert.alert('Error', 'Negocio no configurado');
      return;
    }
    for (const item of d.cart.items) {
      const producto = (d.productos ?? []).find((p: Product) => p.id === item.productoId);
      if (!producto) continue;
      try {
        await d.registrar.mutateAsync({
          ...buildQuickSellPayload({ producto, business: d.business, fecha: d.fecha, metodo: d.metodo }),
          cantidad: item.cantidad,
        });
      } catch (err) {
        Alert.alert('Error', (err as Error).message);
        return;
      }
    }
    d.clearCheckout();
    setShowCachink(true);
    d.playCachink();
    setTimeout(() => d.router.dismissAll(), 600);
  }, [d]);

  return {
    metodo: d.metodo,
    totalCentavos: d.cart?.totalCentavos ?? 0n,
    submitting: d.registrar.isPending,
    showCachink, setShowCachink, handleConfirm,
  };
}

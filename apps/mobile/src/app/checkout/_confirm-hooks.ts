/**
 * Hooks for /checkout/confirm — extracted to keep the route ≤ 40 lines.
 * Underscore prefix → Expo Router ignores this file.
 */

import { useCallback, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import type { Business, IsoDate, PaymentMethod, Product } from '@xangarro/domain';
import { PlanLimitError, today } from '@xangarro/domain';
import {
  buildQuickSellPayload,
  useSaleSound,
  useCheckoutStore,
  useCurrentBusiness,
  useProductosParaVenta,
  useRegistrarVenta,
  type CartState,
} from '@xangarro/ui';
import { useSaleSoundPlayer } from '../../shell/use-sale-sound-player';

export interface ConfirmState {
  metodo: PaymentMethod;
  totalCentavos: bigint;
  submitting: boolean;
  showSaleBurst: boolean;
  setShowSaleBurst: (v: boolean) => void;
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
  playSaleSound: () => void;
} {
  const router = useRouter();
  const { metodo } = useLocalSearchParams<{ metodo: string }>();
  const cart = useCheckoutStore((s) => s.cart);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const registrar = useRegistrarVenta();
  const business = useCurrentBusiness().data ?? null;
  const productos = useProductosParaVenta().data;
  const saleSoundPlayer = useSaleSoundPlayer();
  const { play: playSaleSound } = useSaleSound(saleSoundPlayer);
  return {
    router,
    metodo: (metodo ?? 'Tarjeta') as PaymentMethod,
    cart,
    clearCheckout,
    registrar,
    business,
    productos,
    fecha: today() as IsoDate,
    playSaleSound,
  };
}

export function useConfirmState(): ConfirmState {
  const d = useConfirmDeps();
  const [showSaleBurst, setShowSaleBurst] = useState(false);

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
          ...buildQuickSellPayload({
            producto,
            business: d.business,
            fecha: d.fecha,
            metodo: d.metodo,
          }),
          cantidad: item.cantidad,
        });
      } catch (err) {
        // The plan-limit sheet already explains a PlanLimitError (A-10).
        if (!(err instanceof PlanLimitError)) Alert.alert('Error', (err as Error).message);
        return;
      }
    }
    d.clearCheckout();
    setShowSaleBurst(true);
    d.playSaleSound();
    setTimeout(() => d.router.dismissAll(), 600);
  }, [d]);

  return {
    metodo: d.metodo,
    totalCentavos: d.cart?.totalCentavos ?? 0n,
    submitting: d.registrar.isPending,
    showSaleBurst,
    setShowSaleBurst,
    handleConfirm,
  };
}

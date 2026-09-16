/**
 * Hooks for /checkout/efectivo — extracted to keep the route ≤ 40 lines.
 * Underscore prefix → Expo Router ignores this file.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import type { Business, Money, PaymentMethod, Product, IsoDate } from '@xangarro/domain';
import { PlanLimitError, today } from '@xangarro/domain';
import {
  buildQuickSellPayload,
  useSaleSound,
  useCheckoutStore,
  useCurrentBusiness,
  useEfectivoEsperado,
  useProductosParaVenta,
  useRegistrarVenta,
  type CartState,
} from '@xangarro/ui';
import { useSaleSoundPlayer } from '../../shell/use-sale-sound-player';

function handleMutationError(err: unknown): void {
  // The plan-limit sheet already explains this one (A-10).
  if (err instanceof PlanLimitError) return;
  const msg = (err as Error).message;
  if (msg.includes('no column named')) {
    Alert.alert(
      'Actualización necesaria',
      'Cierra y vuelve a abrir la app para aplicar una actualización de la base de datos.',
    );
  } else {
    Alert.alert('Error', msg);
  }
}

export interface EfectivoState {
  totalCentavos: bigint;
  submitting: boolean;
  efectivoEnCaja: bigint | null;
  showSaleBurst: boolean;
  setShowSaleBurst: (v: boolean) => void;
  handleConfirm: (efectivoRecibido: Money) => Promise<void>;
}

function useEfectivoDeps(): {
  router: ReturnType<typeof useRouter>;
  cart: CartState | null;
  clearCheckout: () => void;
  registrar: ReturnType<typeof useRegistrarVenta>;
  business: Business | null;
  productos: readonly Product[] | undefined;
  fecha: IsoDate;
  efectivoEnCaja: bigint | null;
  playSaleSound: () => void;
} {
  const router = useRouter();
  const cart = useCheckoutStore((s) => s.cart);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const registrar = useRegistrarVenta();
  const business = useCurrentBusiness().data ?? null;
  const productos = useProductosParaVenta().data;
  const fecha = today() as IsoDate;
  const efectivoQ = useEfectivoEsperado({ fecha });
  const saleSoundPlayer = useSaleSoundPlayer();
  const { play: playSaleSound } = useSaleSound(saleSoundPlayer);
  return {
    router,
    cart,
    clearCheckout,
    registrar,
    business,
    productos,
    fecha,
    efectivoEnCaja: efectivoQ.data?.esperado ?? null,
    playSaleSound,
  };
}

async function submitEfectivoItems(
  d: ReturnType<typeof useEfectivoDeps>,
  efectivoRecibido: Money,
): Promise<boolean> {
  if (!d.business || !d.cart) {
    Alert.alert('Error', 'Negocio no configurado');
    return false;
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
          metodo: 'Efectivo' as PaymentMethod,
        }),
        cantidad: item.cantidad,
        efectivoRecibidoCentavos: efectivoRecibido,
      });
    } catch (err) {
      handleMutationError(err);
      return false;
    }
  }
  return true;
}

export function useEfectivoState(): EfectivoState {
  const d = useEfectivoDeps();
  const [showSaleBurst, setShowSaleBurst] = useState(false);

  const handleConfirm = useCallback(
    async (efectivoRecibido: Money) => {
      const ok = await submitEfectivoItems(d, efectivoRecibido);
      if (!ok) return;
      d.clearCheckout();
      setShowSaleBurst(true);
      d.playSaleSound();
      setTimeout(() => d.router.dismissAll(), 600);
    },
    [d],
  );

  return {
    totalCentavos: d.cart?.totalCentavos ?? 0n,
    submitting: d.registrar.isPending,
    efectivoEnCaja: d.efectivoEnCaja,
    showSaleBurst,
    setShowSaleBurst,
    handleConfirm,
  };
}

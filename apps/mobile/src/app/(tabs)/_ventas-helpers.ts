/**
 * Pure helpers and derived-state hooks for the Ventas tab.
 * Extracted to keep ventas.tsx under the 200-line / 40-line-function
 * limits enforced by ESLint (CLAUDE.md §2 #6).
 *
 * Underscore prefix → Expo Router ignores this file as a route.
 */

import { useMemo } from 'react';
import { Alert } from 'react-native';
import { buildQuickSellPayload, useRegistrarVenta } from '@cachink/ui';
import type {
  Business,
  ClientId,
  IsoDate,
  PaymentMethod,
  Product,
  ProductId,
} from '@cachink/domain';

export function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export function useStockMap(
  stockQ: { data?: readonly { producto: { id: string }; stock: number }[] },
): Map<string, number> {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stockQ.data ?? []) map.set(row.producto.id, row.stock);
    return map;
  }, [stockQ.data]);
}

export function makeQuickSellHandler(
  productosQ: { data?: readonly Product[] },
  business: Business | null,
  fecha: IsoDate,
  registrar: ReturnType<typeof useRegistrarVenta>,
  setConfirmProduct: (p: Product | null) => void,
) {
  return (data: {
    productoId: ProductId;
    cantidad: number;
    metodo: PaymentMethod;
    clienteId?: ClientId;
  }): void => {
    const product = productosQ.data?.find((p) => p.id === data.productoId);
    if (!product) return;
    if (!business) {
      Alert.alert(
        'Negocio no configurado',
        'Configura tu negocio en Ajustes antes de registrar ventas.',
      );
      return;
    }
    const payload = buildQuickSellPayload({
      producto: product, business, fecha, metodo: data.metodo,
    });
    registrar.mutate(
      { ...payload, cantidad: data.cantidad, clienteId: data.clienteId },
      {
        onSuccess: () => setConfirmProduct(null),
        onError: (error) => { Alert.alert('Error al registrar venta', error.message); },
      },
    );
  };
}

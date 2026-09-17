/**
 * Expo Router entry for /productos/[id] — read-only product detail with
 * stock Entrada/Salida (A-09).
 */

import type { ReactElement } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View } from '@tamagui/core';
import { today } from '@xangarro/domain';
import { ProductoDetailSmart, useProductosConStock } from '@xangarro/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function ProductoDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const row = (useProductosConStock().data ?? []).find((r) => r.producto.id === id) ?? null;
  // Explicitly back to the Productos tab: tabs switch with `router.replace`, so
  // `router.back()` can land on whichever tab was open before (see nuevo-producto).
  const toProductos = (): void => router.dismissTo('/productos' as never);
  return (
    <AppShellWrapper activeTabKey="productos" onBack={toProductos}>
      {row ? (
        <ProductoDetailSmart row={row} fecha={today()} onBack={toProductos} />
      ) : (
        <View flex={1} alignItems="center" justifyContent="center">
          <Text>Producto no encontrado</Text>
        </View>
      )}
    </AppShellWrapper>
  );
}

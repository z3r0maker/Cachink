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
  return (
    <AppShellWrapper activeTabKey="productos" onBack={() => router.back()}>
      {row ? (
        <ProductoDetailSmart row={row} fecha={today()} onBack={() => router.back()} />
      ) : (
        <View flex={1} alignItems="center" justifyContent="center">
          <Text>Producto no encontrado</Text>
        </View>
      )}
    </AppShellWrapper>
  );
}

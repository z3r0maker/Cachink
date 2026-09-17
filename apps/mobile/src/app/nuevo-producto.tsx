/**
 * Expo Router entry for /nuevo-producto — quick-add a product (A-09).
 * Editing and the icon picker live in the portal.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { NuevoProductoScreen, useCrearProducto, useFeatureFlag } from '@xangarro/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function NuevoProductoRoute(): ReactElement {
  const router = useRouter();
  const crear = useCrearProducto();
  const stockEnabled = useFeatureFlag('stock');
  // Back to the Productos tab explicitly, not `router.back()`: tabs switch with
  // `router.replace`, so the history entry before this screen can be another
  // tab (saving a product landed on Gastos on the iPhone sim).
  const toProductos = (): void => router.dismissTo('/productos' as never);
  return (
    <AppShellWrapper activeTabKey="productos" onBack={toProductos}>
      <NuevoProductoScreen
        onSubmit={(input) => crear.mutate(input, { onSuccess: toProductos })}
        onBack={toProductos}
        submitting={crear.isPending}
        stockEnabled={stockEnabled}
      />
    </AppShellWrapper>
  );
}

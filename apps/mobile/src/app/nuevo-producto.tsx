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
  return (
    <AppShellWrapper activeTabKey="productos" onBack={() => router.back()}>
      <NuevoProductoScreen
        onSubmit={(input) => crear.mutate(input, { onSuccess: () => router.back() })}
        onBack={() => router.back()}
        submitting={crear.isPending}
        stockEnabled={stockEnabled}
      />
    </AppShellWrapper>
  );
}

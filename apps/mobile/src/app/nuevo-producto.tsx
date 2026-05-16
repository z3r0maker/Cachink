/**
 * Expo Router entry for /nuevo-producto — full-page product creation.
 *
 * Phase 18: replaces the NuevoProductoModal on mobile. Uses
 * NuevoProductoScreen from @cachink/ui with AppShellWrapper for
 * persistent bottom tab bar.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  NuevoProductoScreen,
  useCrearProducto,
  useFeatureFlag,
} from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function NuevoProductoRoute(): ReactElement {
  const router = useRouter();
  const crear = useCrearProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');

  return (
    <AppShellWrapper activeTabKey="productos" onBack={() => router.back()}>
      <NuevoProductoScreen
        onSubmit={(input) =>
          crear.mutate(input, {
            onSuccess: () => router.back(),
          })
        }
        onBack={() => router.back()}
        submitting={crear.isPending}
        conversionEnabled={conversionEnabled}
      />
    </AppShellWrapper>
  );
}

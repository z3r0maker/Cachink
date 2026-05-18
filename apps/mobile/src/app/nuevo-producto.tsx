/**
 * Expo Router entry for /nuevo-producto — full-page product creation.
 *
 * Phase 18: replaces the NuevoProductoModal on mobile. Uses
 * NuevoProductoScreen from @cachink/ui with AppShellWrapper for
 * persistent bottom tab bar.
 *
 * QA Fix #13: wires onPickIcon to navigate to icon-picker route
 * via useProductFormStore for state persistence.
 */

import { useRef, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  NuevoProductoScreen,
  initialProductoState,
  useCrearProducto,
  useFeatureFlag,
  useProductFormStore,
  type ProductoFormState,
} from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function NuevoProductoRoute(): ReactElement {
  const router = useRouter();
  const crear = useCrearProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  const setDraft = useProductFormStore((s) => s.setDraft);
  const storeIcon = useProductFormStore((s) => s.draft?.icono ?? null);
  const formRef = useRef<ProductoFormState>(initialProductoState());

  const handlePickIcon = (): void => {
    // Persist the full form state so it survives memory-pressure unmounts
    setDraft({
      ...formRef.current,
      icono: storeIcon,
      editingProductId: null,
    });
    router.push('/productos/icon-picker' as never);
  };

  return (
    <AppShellWrapper activeTabKey="productos" onBack={() => router.back()}>
      <NuevoProductoScreen
        onSubmit={(input) => {
          // Merge the icon from the store into the submission
          const payload = storeIcon ? { ...input, icono: storeIcon } : input;
          crear.mutate(payload, {
            onSuccess: () => {
              useProductFormStore.getState().clear();
              router.back();
            },
          });
        }}
        onBack={() => router.back()}
        submitting={crear.isPending}
        conversionEnabled={conversionEnabled}
        onPickIcon={handlePickIcon}
        onFormChange={(s) => { formRef.current = s; }}
      />
    </AppShellWrapper>
  );
}

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

import { useCallback, useRef, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  NuevoProductoScreen,
  initialProductoState,
  useCrearProducto,
  useFeatureFlag,
  useProductFormStore,
  type CrearProductoInput,
  type ProductoFormState,
} from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

function useNuevoProductoHandlers(): {
  handlePickIcon: () => void;
  handleSubmit: (input: CrearProductoInput) => void;
  formRef: React.RefObject<ProductoFormState>;
  crear: ReturnType<typeof useCrearProducto>;
  conversionEnabled: boolean;
} {
  const router = useRouter();
  const crear = useCrearProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  const setDraft = useProductFormStore((s) => s.setDraft);
  const storeIcon = useProductFormStore((s) => s.draft?.icono ?? null);
  const formRef = useRef<ProductoFormState>(initialProductoState());

  const handlePickIcon = (): void => {
    setDraft({ ...formRef.current, icono: storeIcon, editingProductId: null });
    router.push('/productos/icon-picker' as never);
  };

  const handleSubmit = useCallback(
    (input: CrearProductoInput) => {
      const payload = storeIcon ? { ...input, icono: storeIcon } : input;
      crear.mutate(payload, {
        onSuccess: () => {
          useProductFormStore.getState().clear();
          router.back();
        },
      });
    },
    [storeIcon, crear, router],
  );

  return { handlePickIcon, handleSubmit, formRef, crear, conversionEnabled };
}

export default function NuevoProductoRoute(): ReactElement {
  const router = useRouter();
  const h = useNuevoProductoHandlers();

  return (
    <AppShellWrapper activeTabKey="productos" onBack={() => router.back()}>
      <NuevoProductoScreen
        onSubmit={h.handleSubmit}
        onBack={() => router.back()}
        submitting={h.crear.isPending}
        conversionEnabled={h.conversionEnabled}
        onPickIcon={h.handlePickIcon}
        onFormChange={(s) => { h.formRef.current = s; }}
      />
    </AppShellWrapper>
  );
}

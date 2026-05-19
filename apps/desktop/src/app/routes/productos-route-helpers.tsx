/**
 * Sub-components for ProductosRoute (desktop).
 * Extracted to keep productos-route.tsx under 40-line-function limits.
 */
import { type ReactElement } from 'react';
import {
  NuevoProductoModal,
  useCrearProducto,
  useFeatureFlag,
  useProductFormStore,
} from '@cachink/ui';

interface ProductoModalSectionProps {
  open: boolean;
  onClose: () => void;
  onNavigateIconPicker: () => void;
}

export function ProductoModalSection(props: ProductoModalSectionProps): ReactElement {
  const crear = useCrearProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  const storeIcon = useProductFormStore((s) => s.draft?.icono ?? null);

  return (
    <NuevoProductoModal
      open={props.open}
      onClose={props.onClose}
      onSubmit={(input) => {
        const payload = storeIcon ? { ...input, icono: storeIcon } : input;
        crear.mutate(payload, {
          onSuccess: () => {
            useProductFormStore.getState().clear();
            props.onClose();
          },
        });
      }}
      submitting={crear.isPending}
      conversionEnabled={conversionEnabled}
      onPickIcon={() => {
        useProductFormStore.getState().setDraft({
          nombre: '',
          sku: '',
          categoria: 'Producto Terminado',
          usoProducto: 'venta',
          costoPesos: '',
          precioVentaPesos: '',
          unidad: 'pza',
          umbral: '3',
          colorFondo: 'white',
          icono: storeIcon,
          editingProductId: null,
        });
        props.onNavigateIconPicker();
      }}
    />
  );
}

/**
 * NuevoProductoScreen — full-page form for creating a new product.
 *
 * Replaces the modal approach because the form is growing with
 * usoProducto + future recipe linking. ScrollView with sections.
 *
 * Phase 18: new product form as a full page.
 */

import { useEffect, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { useTranslation } from '../../i18n/index';
import {
  buildProductoPayload,
  useProductoForm,
  validateProducto,
  validationMessages,
  type ProductoFormState,
} from './nuevo-producto-form';
import { SectionHeader } from './section-header';
import { ProductoFormBody } from './producto-form-body';

export interface NuevoProductoScreenProps {
  readonly onSubmit: (input: CrearProductoInput) => void;
  readonly onBack: () => void;
  readonly submitting?: boolean;
  readonly conversionEnabled?: boolean;
  /** Navigate to icon picker screen. */
  readonly onPickIcon?: () => void;
  /** Fires on every form update — used to persist state before navigation. */
  readonly onFormChange?: (state: ProductoFormState) => void;
  readonly testID?: string;
}

function useScreenSubmit(
  form: ReturnType<typeof useProductoForm>,
  onSubmit: (input: CrearProductoInput) => void,
  t: ReturnType<typeof useTranslation>['t'],
) {
  return (): void => {
    const v = validateProducto(form.state, validationMessages(t));
    if (Object.keys(v).length > 0) {
      form.setErrors(v);
      return;
    }
    form.setErrors({});
    onSubmit(buildProductoPayload(form.state));
    form.reset();
  };
}

export function NuevoProductoScreen(props: NuevoProductoScreenProps): ReactElement {
  const { t } = useTranslation();
  const form = useProductoForm();
  const handleSubmit = useScreenSubmit(form, props.onSubmit, t);
  useEffect(() => props.onFormChange?.(form.state), [form.state]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      testID={props.testID ?? 'nuevo-producto-screen'}
    >
      <SectionHeader label={t('nuevoProducto.title')} />
      <ProductoFormBody
        form={form}
        onSubmit={handleSubmit}
        submitting={props.submitting === true}
        conversionEnabled={props.conversionEnabled === true}
        onPickIcon={props.onPickIcon}
      />
    </ScrollView>
  );
}

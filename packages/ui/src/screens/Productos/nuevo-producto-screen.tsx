/**
 * NuevoProductoScreen — full-page form for creating a new product.
 *
 * Replaces the modal approach because the form is growing with
 * usoProducto + future recipe linking. ScrollView with sections.
 *
 * Phase 18: new product form as a full page.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ScrollView, type TextInput } from 'react-native';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { Btn, Scanner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  buildProductoPayload,
  useProductoForm,
  validateProducto,
  validationMessages,
  type ProductoFormState,
} from './nuevo-producto-form';
import { SectionHeader } from './section-header';
import {
  AppearanceField,
  CategoryFields,
  IdentityFields,
  PricingFields,
  StockFields,
} from './producto-form-fields';

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
  const [scanOpen, setScanOpen] = useState(false);
  const handleSubmit = useScreenSubmit(form, props.onSubmit, t);
  const skuRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);
  const precioRef = useRef<TextInput>(null);
  useEffect(() => props.onFormChange?.(form.state), [form.state]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      testID={props.testID ?? 'nuevo-producto-screen'}
    >
      <SectionHeader label={t('nuevoProducto.title')} />
      <IdentityFields form={form} t={t} onScan={() => setScanOpen(true)} skuRef={skuRef} />
      <CategoryFields form={form} t={t} conversionEnabled={props.conversionEnabled === true} />
      <PricingFields form={form} t={t} showPrecio={form.state.usoProducto !== 'materia-prima'} costoRef={costoRef} precioRef={precioRef} />
      <StockFields form={form} t={t} onSubmitEditing={handleSubmit} />
      <AppearanceField form={form} t={t} onPickIcon={props.onPickIcon} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        loading={props.submitting === true}
        fullWidth
        testID="producto-submit"
      >
        {t('nuevoProducto.save')}
      </Btn>
      <Scanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(code) => form.update({ sku: code })}
        mode="single"
      />
    </ScrollView>
  );
}

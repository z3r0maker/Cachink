/**
 * NuevoProductoModal — create a new producto in the catalog.
 *
 * @deprecated Use NuevoProductoScreen for mobile (full page).
 * This modal is kept for desktop backward-compat.
 *
 * Phase 18: now delegates to shared field components from
 * producto-form-fields.tsx.
 */

import { useRef, useState, type ReactElement } from 'react';
import { type TextInput } from 'react-native';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { Btn, Modal, Scanner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  buildProductoPayload,
  useProductoForm,
  validateProducto,
  validationMessages,
} from './nuevo-producto-form';
import {
  AppearanceField,
  CategoryFields,
  IdentityFields,
  PricingFields,
  StockFields,
} from './producto-form-fields';

export interface NuevoProductoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: CrearProductoInput) => void;
  readonly submitting?: boolean;
  readonly conversionEnabled?: boolean;
  /** Navigate to icon picker (desktop wiring). */
  readonly onPickIcon?: () => void;
}

function useModalSubmit(
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

export function NuevoProductoModal(props: NuevoProductoModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useProductoForm();
  const [scanOpen, setScanOpen] = useState(false);
  const handleSubmit = useModalSubmit(form, props.onSubmit, t);
  const skuRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);
  const precioRef = useRef<TextInput>(null);

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevoProducto.title')}
      testID="nuevo-producto-modal"
    >
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
    </Modal>
  );
}

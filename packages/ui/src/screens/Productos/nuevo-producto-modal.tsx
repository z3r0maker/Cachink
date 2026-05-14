/**
 * NuevoProductoModal — create a new producto in the catalog.
 *
 * @deprecated Use NuevoProductoScreen for mobile (full page).
 * This modal is kept for desktop backward-compat.
 *
 * Phase 18: now delegates to shared field components from
 * producto-form-fields.tsx.
 */

import { useState, type ReactElement } from 'react';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { Btn, Modal, Scanner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  buildProductoPayload,
  useProductoForm,
  validateProducto,
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
}

export function NuevoProductoModal(props: NuevoProductoModalProps): ReactElement {
  const { t } = useTranslation();
  const form = useProductoForm();
  const [scanOpen, setScanOpen] = useState(false);
  const showPrecio = form.state.usoProducto !== 'materia-prima';

  const handleSubmit = (): void => {
    const msgs = {
      required: t('validation.required'),
      greaterThanZero: t('validation.greaterThanZero'),
      invalidNumber: t('validation.invalidNumber'),
    };
    const v = validateProducto(form.state, msgs);
    if (Object.keys(v).length > 0) {
      form.setErrors(v);
      return;
    }
    form.setErrors({});
    props.onSubmit(buildProductoPayload(form.state));
    form.reset();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevoProducto.title')}
      testID="nuevo-producto-modal"
    >
      <IdentityFields form={form} t={t} onScan={() => setScanOpen(true)} />
      <CategoryFields
        form={form}
        t={t}
        conversionEnabled={props.conversionEnabled === true}
      />
      <PricingFields form={form} t={t} showPrecio={showPrecio} />
      <StockFields form={form} t={t} onSubmitEditing={handleSubmit} />
      <AppearanceField form={form} t={t} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
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

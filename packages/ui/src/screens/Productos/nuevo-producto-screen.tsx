/**
 * NuevoProductoScreen — full-page form for creating a new product.
 *
 * Replaces the modal approach because the form is growing with
 * usoProducto + future recipe linking. ScrollView with sections.
 *
 * Phase 18: new product form as a full page.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { Btn, Scanner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  buildProductoPayload,
  useProductoForm,
  validateProducto,
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
  readonly testID?: string;
}

export function NuevoProductoScreen(props: NuevoProductoScreenProps): ReactElement {
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
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      testID={props.testID ?? 'nuevo-producto-screen'}
    >
      <SectionHeader label={t('nuevoProducto.title')} />
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
    </ScrollView>
  );
}

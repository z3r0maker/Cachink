/**
 * ProductoFormBody — the field sections + save button + scanner shared by
 * NuevoProductoModal and NuevoProductoScreen (CLAUDE.md §2.3: one place).
 */

import { useRef, useState, type ReactElement } from 'react';
import { type TextInput } from 'react-native';
import { Btn, Scanner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { useProductoForm } from './nuevo-producto-form';
import {
  AppearanceField,
  CategoryFields,
  IdentityFields,
  PricingFields,
  StockFields,
} from './producto-form-fields';

export interface ProductoFormBodyProps {
  readonly form: ReturnType<typeof useProductoForm>;
  readonly onSubmit: () => void;
  readonly submitting: boolean;
  readonly conversionEnabled: boolean;
  readonly onPickIcon?: () => void;
}

export function ProductoFormBody(props: ProductoFormBodyProps): ReactElement {
  const { form, onSubmit } = props;
  const { t } = useTranslation();
  const [scanOpen, setScanOpen] = useState(false);
  const skuRef = useRef<TextInput>(null);
  const costoRef = useRef<TextInput>(null);
  const precioRef = useRef<TextInput>(null);
  return (
    <>
      <IdentityFields form={form} t={t} onScan={() => setScanOpen(true)} skuRef={skuRef} />
      <CategoryFields form={form} t={t} conversionEnabled={props.conversionEnabled} />
      <PricingFields
        form={form}
        t={t}
        showPrecio={form.state.usoProducto !== 'materia-prima'}
        costoRef={costoRef}
        precioRef={precioRef}
      />
      <StockFields form={form} t={t} onSubmitEditing={onSubmit} />
      <AppearanceField form={form} t={t} onPickIcon={props.onPickIcon} />
      <Btn
        variant="primary"
        onPress={onSubmit}
        loading={props.submitting}
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
    </>
  );
}

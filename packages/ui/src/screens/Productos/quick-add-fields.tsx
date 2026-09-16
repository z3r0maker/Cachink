/**
 * QuickAddFields — the five quick-add product inputs (A-09) plus the barcode
 * scanner that fills the código.
 */

import { useRef, useState, type ReactElement } from 'react';
import type { TextInput } from 'react-native';
import type { InventoryCategory } from '@xangarro/domain';
import { Btn, Icon, Input, OptionCardGroup, Scanner } from '../../components/index';
import { focusRef, MoneyField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import {
  INV_CATEGORIAS,
  stockTrackingCards,
  type ProductoFormApi,
  type StockTracking,
} from './nuevo-producto-form';

type Props = { readonly form: ProductoFormApi };

/** "Escanear código" button + scanner sheet. */
function ScanCode(props: { onCode: (code: string) => void }): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn
        variant="ghost"
        onPress={() => setOpen(true)}
        fullWidth
        icon={<Icon name="camera" size={16} />}
        testID="producto-scan"
      >
        {t('scanner.title')}
      </Btn>
      <Scanner open={open} onClose={() => setOpen(false)} onScan={props.onCode} mode="single" />
    </>
  );
}

/** Nombre + código, with the scanner that fills the código. */
function IdentityInputs({ form }: Props): ReactElement {
  const { t } = useTranslation();
  const skuRef = useRef<TextInput>(null);
  return (
    <>
      <TextField
        label={t('nuevoProducto.nombreLabel')}
        placeholder={t('nuevoProducto.nombrePlaceholder')}
        value={form.state.nombre}
        onChange={(v) => form.update({ nombre: v })}
        error={form.errors.nombre}
        required
        testID="producto-nombre"
        returnKeyType="next"
        onSubmitEditing={() => focusRef(skuRef)}
        blurOnSubmit={false}
      />
      <TextField
        label={t('nuevoProducto.skuLabel')}
        placeholder={t('nuevoProducto.skuPlaceholder')}
        value={form.state.sku}
        onChange={(v) => form.update({ sku: v })}
        testID="producto-sku"
        inputRef={skuRef}
      />
      <ScanCode onCode={(code) => form.update({ sku: code })} />
    </>
  );
}

/** Categoría, precio de venta and whether stock is tracked. */
function SaleInputs({ form }: Props): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Input
        type="select"
        label={t('nuevoProducto.categoriaLabel')}
        value={form.state.categoria}
        onChange={(v) => form.update({ categoria: v as InventoryCategory })}
        options={INV_CATEGORIAS}
        testID="producto-categoria"
      />
      <MoneyField
        label={t('nuevoProducto.precioVentaLabel')}
        value={form.state.precioVentaPesos}
        onChange={(v) => form.update({ precioVentaPesos: v })}
        error={form.errors.precioVenta}
        required
        testID="producto-precio-venta"
      />
      <OptionCardGroup<StockTracking>
        value={form.state.stock}
        onChange={(v) => form.update({ stock: v })}
        options={stockTrackingCards(t)}
        testID="producto-stock-tracking"
      />
    </>
  );
}

export function QuickAddFields({ form }: Props): ReactElement {
  return (
    <>
      <IdentityInputs form={form} />
      <SaleInputs form={form} />
    </>
  );
}

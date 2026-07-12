/**
 * Shared sub-field groups for the product form (create + edit).
 *
 * Extracted so NuevoProductoScreen and NuevoProductoModal stay under
 * the 200-line budget.
 */

import type { ReactElement } from 'react';
import type { InventoryCategory, InventoryUnit, UsoProducto } from '@cachink/domain';
import {
  Btn,
  Combobox,
  Icon,
  Input,
  OptionCardGroup,
} from '../../components/index';
import { focusRef, IntegerField, MoneyField, StepperField, TextField } from '../../components/fields/index';
import type { useTranslation } from '../../i18n/index';
import {
  INV_CATEGORIAS,
  INV_UNIDADES_OPTIONS,
  USO_PRODUCTO_CARDS,
  type ProductoFormApi,
} from './nuevo-producto-form';
import { MargenGananciaRow } from './margen-ganancia-row';

type T = ReturnType<typeof useTranslation>['t'];

export function IdentityFields(props: {
  form: ProductoFormApi;
  t: T;
  onScan: () => void;
  skuRef?: React.RefObject<unknown>;
}): ReactElement {
  const { form, t } = props;
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
        onSubmitEditing={() => focusRef(props.skuRef)}
        blurOnSubmit={false}
      />
      <TextField
        label={t('nuevoProducto.skuLabel')}
        placeholder={t('nuevoProducto.skuPlaceholder')}
        value={form.state.sku}
        onChange={(v) => form.update({ sku: v })}
        testID="producto-sku"
        returnKeyType="next"
        inputRef={props.skuRef}
      />
      <Btn variant="ghost" onPress={props.onScan} fullWidth icon={<Icon name="camera" size={16} />} testID="producto-scan">
        {t('scanner.title')}
      </Btn>
    </>
  );
}

export function CategoryFields({
  form,
  t,
  conversionEnabled,
}: {
  form: ProductoFormApi;
  t: T;
  conversionEnabled: boolean;
}): ReactElement {
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
      {conversionEnabled && (
        <OptionCardGroup
          label={t('nuevoProducto.usoLabel')}
          value={form.state.usoProducto}
          onChange={(v) => form.update({ usoProducto: v as UsoProducto })}
          options={USO_PRODUCTO_CARDS}
          testID="producto-uso"
        />
      )}
    </>
  );
}

function PrecioVentaBlock({ form, t, precioRef }: {
  form: ProductoFormApi; t: T; precioRef?: React.RefObject<unknown>;
}): ReactElement {
  return (
    <>
      <MoneyField
        label={t('nuevoProducto.precioVentaLabel')}
        value={form.state.precioVentaPesos}
        onChange={(v) => form.update({ precioVentaPesos: v })}
        error={form.errors.precioVenta}
        required
        testID="producto-precio-venta"
        returnKeyType="next"
        inputRef={precioRef}
      />
      <MargenGananciaRow
        costoPesos={form.state.costoPesos}
        precioVentaPesos={form.state.precioVentaPesos}
        t={t}
      />
    </>
  );
}

export function PricingFields(props: {
  form: ProductoFormApi;
  t: T;
  showPrecio: boolean;
  costoRef?: React.RefObject<unknown>;
  precioRef?: React.RefObject<unknown>;
}): ReactElement {
  const { form, t } = props;
  return (
    <>
      <MoneyField
        label={t('nuevoProducto.costoUnitLabel')}
        value={form.state.costoPesos}
        onChange={(v) => form.update({ costoPesos: v })}
        error={form.errors.costo}
        required
        testID="producto-costo"
        returnKeyType="next"
        inputRef={props.costoRef}
        onSubmitEditing={props.showPrecio ? () => focusRef(props.precioRef) : undefined}
        blurOnSubmit={!props.showPrecio}
      />
      {props.showPrecio && <PrecioVentaBlock form={form} t={t} precioRef={props.precioRef} />}
      <Combobox label={t('nuevoProducto.unidadLabel')} value={form.state.unidad} onChange={(v) => form.update({ unidad: v as InventoryUnit })} options={INV_UNIDADES_OPTIONS} testID="producto-unidad" />
    </>
  );
}

export function StockFields({
  form,
  t,
  onSubmitEditing,
}: {
  form: ProductoFormApi;
  t: T;
  onSubmitEditing: () => void;
}): ReactElement {
  return (
    <>
      <StepperField
        label={t('nuevoProducto.umbralLabel')}
        value={Number(form.state.umbral) || 0}
        onChange={(v) => form.update({ umbral: String(v) })}
        min={0}
        max={100}
        error={form.errors.umbral}
        testID="producto-umbral"
      />
      <IntegerField
        label={t('nuevoProducto.stockInicialLabel')}
        value={form.state.stockInicial}
        onChange={(v) => form.update({ stockInicial: v })}
        min={0}
        testID="producto-stock-inicial"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

// Re-export AppearanceField from its own file for backwards-compat
export { AppearanceField } from './appearance-field';

/**
 * PricingSection — extracted from producto-detail-fields to keep
 * the parent file under 200 lines.
 */

import type { ReactElement } from 'react';
import type { InventoryUnit, UsoProducto } from '@cachink/domain';
import { Combobox, OptionCardGroup } from '../../components/index';
import { MoneyField } from '../../components/fields/index';
import { INV_UNIDADES_OPTIONS, USO_PRODUCTO_CARDS } from './nuevo-producto-form';
import { SectionHeader } from './section-header';
import type { DetailFormState, DetailFormErrors } from './producto-detail-fields';

type T = (key: string) => string;

function PricingFields(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  showPrecio: boolean;
  onChange: (p: Partial<DetailFormState>) => void;
}): ReactElement {
  return (
    <>
      <MoneyField
        label="Costo unitario"
        value={props.state.costoPesos}
        onChange={(v) => props.onChange({ costoPesos: v })}
        error={props.errors.costo}
        required
        testID="detail-costo"
      />
      {props.showPrecio && (
        <MoneyField
          label="Precio venta"
          value={props.state.precioVentaPesos}
          onChange={(v) => props.onChange({ precioVentaPesos: v })}
          error={props.errors.precioVenta}
          required
          testID="detail-precio"
        />
      )}
    </>
  );
}

function UnitAndUsoFields(props: {
  state: DetailFormState;
  onChange: (p: Partial<DetailFormState>) => void;
  conversionEnabled: boolean;
}): ReactElement {
  return (
    <>
      <Combobox
        label="Unidad"
        value={props.state.unidad}
        onChange={(v) => props.onChange({ unidad: v as InventoryUnit })}
        options={INV_UNIDADES_OPTIONS}
        testID="detail-unidad"
      />
      {props.conversionEnabled && (
        <OptionCardGroup
          label="Uso del producto"
          value={props.state.usoProducto}
          onChange={(v) => props.onChange({ usoProducto: v as UsoProducto })}
          options={USO_PRODUCTO_CARDS}
          testID="detail-uso"
        />
      )}
    </>
  );
}

/** Pricing section: costo + precio + unidad. */
export function PricingSection(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  showPrecio: boolean;
  onChange: (p: Partial<DetailFormState>) => void;
  conversionEnabled: boolean;
  t: T;
}): ReactElement {
  return (
    <>
      <SectionHeader label="Precios" />
      <PricingFields
        state={props.state}
        errors={props.errors}
        showPrecio={props.showPrecio}
        onChange={props.onChange}
      />
      <UnitAndUsoFields
        state={props.state}
        onChange={props.onChange}
        conversionEnabled={props.conversionEnabled}
      />
    </>
  );
}

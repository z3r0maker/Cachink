/**
 * Field groups for EditarProductoModal — split out to keep the modal under
 * the 200-line / 40-line caps (CLAUDE.md §2.6).
 */

import type { ReactElement } from 'react';
import type { InventoryCategory, InventoryUnit } from '@xangarro/domain';
import { ColorSwatchPicker, Combobox } from '../../components/index';
import { OptionCardGroup } from '../../components/OptionCardGroup/index';
import { Input } from '../../components/Input/index';
import { IntegerField, TextField } from '../../components/fields/index';
import { INV_UNIDADES_OPTIONS, USO_PRODUCTO_CARDS } from './nuevo-producto-form';
import type { EditFormErrors, FormState, T } from './editar-producto-modal';

const CATEGORIAS: readonly InventoryCategory[] = [
  'Materia Prima',
  'Producto Terminado',
  'Empaque',
  'Herramienta',
  'Insumo',
  'Otro',
];

export interface EditFieldsProps {
  state: FormState;
  errors: EditFormErrors;
  patch: (n: Partial<FormState>) => void;
  conversionEnabled: boolean;
  t: T;
  onSubmit: () => void;
}

/** Nombre, SKU, categoría and (when conversion is on) uso. */
export function EditIdentityFields(props: EditFieldsProps): ReactElement {
  const { state, errors, patch, t } = props;
  return (
    <>
      <TextField
        label={t('editarProducto.nombreLabel')}
        value={state.nombre}
        onChange={(v) => patch({ nombre: v })}
        error={errors.nombre}
        required
        testID="editar-producto-nombre"
        returnKeyType="next"
      />
      <TextField
        label={t('editarProducto.skuLabel')}
        value={state.sku}
        onChange={(v) => patch({ sku: v })}
        testID="editar-producto-sku"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevoProducto.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => patch({ categoria: v as InventoryCategory })}
        options={CATEGORIAS}
        testID="editar-producto-categoria"
      />
      {props.conversionEnabled && (
        <OptionCardGroup
          label={t('nuevoProducto.usoLabel')}
          value={state.usoProducto}
          onChange={(v) => patch({ usoProducto: v })}
          options={USO_PRODUCTO_CARDS}
          testID="editar-producto-uso"
        />
      )}
    </>
  );
}

/** Unidad, umbral de stock bajo and colour. */
export function EditStockFields(props: EditFieldsProps): ReactElement {
  const { state, errors, patch, t } = props;
  return (
    <>
      <Combobox
        label="Unidad"
        value={state.unidad}
        onChange={(v) => patch({ unidad: v as InventoryUnit })}
        options={INV_UNIDADES_OPTIONS}
        testID="editar-producto-unidad"
      />
      <IntegerField
        label={t('editarProducto.umbralLabel')}
        value={state.umbralStockBajo}
        onChange={(v) => patch({ umbralStockBajo: v })}
        min={0}
        max={9999}
        note={t('editarProducto.costoNote')}
        error={errors.umbral}
        testID="editar-producto-umbral"
        returnKeyType="done"
        onSubmitEditing={props.onSubmit}
        blurOnSubmit
      />
      <ColorSwatchPicker
        label={t('editarProducto.colorFondoLabel')}
        value={state.colorFondo}
        onChange={(v) => patch({ colorFondo: v })}
        testID="editar-producto-color-fondo"
      />
    </>
  );
}

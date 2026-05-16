/**
 * EditarProductoModal — partial-edit form behind the Stock list
 * swipe-to-edit gesture (Audit Round 2 J3, Phase K wiring).
 *
 * Phase 18: added usoProducto field (conditionally shown when
 * conversionEnabled is true).
 */

import { useEffect, useState, type ReactElement } from 'react';
import type {
  InventoryCategory,
  InventoryUnit,
  Product,
  ProductColor,
  UsoProducto,
} from '@cachink/domain';
import type { ProductPatch } from '@cachink/data';
import { Btn, ColorSwatchPicker, Combobox, Modal } from '../../components/index';
import { OptionCardGroup } from '../../components/OptionCardGroup/index';
import { Input } from '../../components/Input/index';
import { IntegerField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { INV_UNIDADES_OPTIONS, USO_PRODUCTO_CARDS } from './nuevo-producto-form';
import { useEditarProducto } from '../../hooks/use-editar-producto';

export interface EditarProductoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editing: Product | null;
  readonly conversionEnabled?: boolean;
  readonly testID?: string;
}

const CATEGORIAS: readonly InventoryCategory[] = [
  'Materia Prima', 'Producto Terminado', 'Empaque',
  'Herramienta', 'Insumo', 'Otro',
];

interface FormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  usoProducto: UsoProducto;
  unidad: InventoryUnit;
  umbralStockBajo: string;
  colorFondo: ProductColor;
}

interface EditFormErrors {
  nombre?: string;
  umbral?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function fromProduct(p: Product | null): FormState {
  if (!p) {
    return {
      nombre: '', sku: '', categoria: 'Otro', usoProducto: 'venta',
      unidad: 'pza', umbralStockBajo: '3', colorFondo: 'white',
    };
  }
  return {
    nombre: p.nombre, sku: p.sku ?? '', categoria: p.categoria,
    usoProducto: p.usoProducto ?? 'venta', unidad: p.unidad,
    umbralStockBajo: String(p.umbralStockBajo), colorFondo: p.colorFondo ?? 'white',
  };
}

function buildPatch(state: FormState): ProductPatch {
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() === '' ? null : state.sku.trim(),
    categoria: state.categoria, usoProducto: state.usoProducto,
    unidad: state.unidad,
    umbralStockBajo: Math.max(0, Number.parseInt(state.umbralStockBajo, 10) || 0),
    colorFondo: state.colorFondo,
  };
}

function useEditarProductoForm(editing: Product | null, onClose: () => void) {
  const { t } = useTranslation();
  const editar = useEditarProducto();
  const [state, setState] = useState<FormState>(fromProduct(editing));
  const [errors, setErrors] = useState<EditFormErrors>({});
  useEffect(() => { setState(fromProduct(editing)); setErrors({}); }, [editing]);
  const patch = (next: Partial<FormState>): void => setState((prev) => ({ ...prev, ...next }));
  const handleSubmit = (): void => {
    if (!editing) return;
    const v: EditFormErrors = {};
    if (!state.nombre.trim()) v.nombre = t('validation.required');
    const u = Number(state.umbralStockBajo);
    if (!Number.isInteger(u) || u < 0) v.umbral = t('validation.invalidNumber');
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    editar.mutate({ id: editing.id, patch: buildPatch(state) }, { onSuccess: () => onClose() });
  };
  return { state, errors, patch, handleSubmit, saving: editar.isPending };
}

function EditFormFields(props: {
  state: FormState;
  errors: EditFormErrors;
  patch: (n: Partial<FormState>) => void;
  conversionEnabled: boolean;
  t: T;
  onSubmit: () => void;
}): ReactElement {
  const { state, errors, patch, t } = props;
  return (
    <>
      <TextField label={t('editarProducto.nombreLabel')} value={state.nombre}
        onChange={(v) => patch({ nombre: v })} error={errors.nombre} required
        testID="editar-producto-nombre" returnKeyType="next" />
      <TextField label={t('editarProducto.skuLabel')} value={state.sku}
        onChange={(v) => patch({ sku: v })} testID="editar-producto-sku" returnKeyType="next" />
      <Input type="select" label={t('nuevoProducto.categoriaLabel')} value={state.categoria}
        onChange={(v) => patch({ categoria: v as InventoryCategory })} options={CATEGORIAS}
        testID="editar-producto-categoria" />
      {props.conversionEnabled && (
        <OptionCardGroup label={t('nuevoProducto.usoLabel')} value={state.usoProducto}
          onChange={(v) => patch({ usoProducto: v })} options={USO_PRODUCTO_CARDS}
          testID="editar-producto-uso" />
      )}
      <Combobox label="Unidad" value={state.unidad}
        onChange={(v) => patch({ unidad: v as InventoryUnit })} options={INV_UNIDADES_OPTIONS}
        testID="editar-producto-unidad" />
      <IntegerField label={t('editarProducto.umbralLabel')} value={state.umbralStockBajo}
        onChange={(v) => patch({ umbralStockBajo: v })} min={0} max={9999}
        note={t('editarProducto.costoNote')} error={errors.umbral}
        testID="editar-producto-umbral" returnKeyType="done"
        onSubmitEditing={props.onSubmit} blurOnSubmit />
      <ColorSwatchPicker label={t('editarProducto.colorFondoLabel')} value={state.colorFondo}
        onChange={(v) => patch({ colorFondo: v })} testID="editar-producto-color-fondo" />
    </>
  );
}

export function EditarProductoModal(props: EditarProductoModalProps): ReactElement {
  const { t } = useTranslation();
  const { state, errors, patch, handleSubmit, saving } = useEditarProductoForm(
    props.editing, props.onClose,
  );
  return (
    <Modal open={props.open} onClose={props.onClose}
      title={t('editarProducto.title')} testID={props.testID ?? 'editar-producto-modal'}>
      <EditFormFields state={state} errors={errors} patch={patch}
        conversionEnabled={props.conversionEnabled === true} t={t} onSubmit={handleSubmit} />
      <Btn variant="primary" onPress={handleSubmit} disabled={saving} fullWidth
        testID="editar-producto-submit">
        {t('editarProducto.save')}
      </Btn>
    </Modal>
  );
}

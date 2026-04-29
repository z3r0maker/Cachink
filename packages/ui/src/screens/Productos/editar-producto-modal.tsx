/**
 * EditarProductoModal — partial-edit form behind the Stock list
 * swipe-to-edit gesture (Audit Round 2 J3, Phase K wiring).
 *
 * Pre-populates from the supplied `editing` Product and submits the
 * diff via `useEditarProducto`. `costoUnitCentavos` is intentionally
 * omitted: changing the unit cost retroactively corrupts inventory
 * valuation on the Balance General. The note copy explains this to
 * the user (es-MX `editarProducto.costoNote`).
 */

import { useEffect, useState, type ReactElement } from 'react';
import type { InventoryCategory, InventoryUnit, Product } from '@cachink/domain';
import type { ProductPatch } from '@cachink/data';
import { Btn, Modal } from '../../components/index';
import { Input } from '../../components/Input/index';
import { IntegerField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { useEditarProducto } from '../../hooks/use-editar-producto';

export interface EditarProductoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editing: Product | null;
  readonly testID?: string;
}

const CATEGORIAS: readonly InventoryCategory[] = [
  'Materia Prima',
  'Producto Terminado',
  'Empaque',
  'Herramienta',
  'Insumo',
  'Otro',
];

const UNIDADES: readonly InventoryUnit[] = [
  'pza',
  'kg',
  'lt',
  'm',
  'caja',
  'bolsa',
  'rollo',
  'par',
  'otro',
];

interface FormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  unidad: InventoryUnit;
  umbralStockBajo: string;
}

function fromProduct(p: Product | null): FormState {
  if (!p) {
    return {
      nombre: '',
      sku: '',
      categoria: 'Otro',
      unidad: 'pza',
      umbralStockBajo: '3',
    };
  }
  return {
    nombre: p.nombre,
    sku: p.sku ?? '',
    categoria: p.categoria,
    unidad: p.unidad,
    umbralStockBajo: String(p.umbralStockBajo),
  };
}

type Patch = (next: Partial<FormState>) => void;
type T = ReturnType<typeof useTranslation>['t'];

function NameAndSku({ state, patch, t }: { state: FormState; patch: Patch; t: T }): ReactElement {
  return (
    <>
      <TextField
        label={t('editarProducto.nombreLabel')}
        value={state.nombre}
        onChange={(v) => patch({ nombre: v })}
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
    </>
  );
}

function ClassificationFields({
  state,
  patch,
  t,
}: {
  state: FormState;
  patch: Patch;
  t: T;
}): ReactElement {
  return (
    <>
      <Input
        type="select"
        label={t('nuevaVenta.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => patch({ categoria: v as InventoryCategory })}
        options={CATEGORIAS}
        testID="editar-producto-categoria"
      />
      <Input
        type="select"
        label="Unidad"
        value={state.unidad}
        onChange={(v) => patch({ unidad: v as InventoryUnit })}
        options={UNIDADES}
        testID="editar-producto-unidad"
      />
    </>
  );
}

function UmbralField({
  state,
  patch,
  t,
  onSubmit,
}: {
  state: FormState;
  patch: Patch;
  t: T;
  onSubmit: () => void;
}): ReactElement {
  return (
    <IntegerField
      label={t('editarProducto.umbralLabel')}
      value={state.umbralStockBajo}
      onChange={(v) => patch({ umbralStockBajo: v })}
      min={0}
      max={9999}
      note={t('editarProducto.costoNote')}
      testID="editar-producto-umbral"
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      blurOnSubmit
    />
  );
}

function buildPatch(state: FormState): ProductPatch {
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() === '' ? null : state.sku.trim(),
    categoria: state.categoria,
    unidad: state.unidad,
    umbralStockBajo: Math.max(0, Number.parseInt(state.umbralStockBajo, 10) || 0),
  };
}

export function EditarProductoModal(props: EditarProductoModalProps): ReactElement {
  const { t } = useTranslation();
  const editar = useEditarProducto();
  const [state, setState] = useState<FormState>(fromProduct(props.editing));
  useEffect(() => {
    setState(fromProduct(props.editing));
  }, [props.editing]);
  const patch = (next: Partial<FormState>): void => setState((prev) => ({ ...prev, ...next }));
  const handleSubmit = (): void => {
    if (!props.editing) return;
    editar.mutate(
      { id: props.editing.id, patch: buildPatch(state) },
      { onSuccess: () => props.onClose() },
    );
  };
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('editarProducto.title')}
      testID={props.testID ?? 'editar-producto-modal'}
    >
      <NameAndSku state={state} patch={patch} t={t} />
      <ClassificationFields state={state} patch={patch} t={t} />
      <UmbralField state={state} patch={patch} t={t} onSubmit={handleSubmit} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={editar.isPending}
        fullWidth
        testID="editar-producto-submit"
      >
        {t('editarProducto.save')}
      </Btn>
    </Modal>
  );
}

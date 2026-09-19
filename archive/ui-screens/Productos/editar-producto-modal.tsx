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
} from '@xangarro/domain';
import type { ProductPatch } from '@xangarro/data';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import {
  EditIdentityFields,
  EditStockFields,
  type EditFieldsProps,
} from './editar-producto-fields';
import { useEditarProducto } from '../../hooks/use-editar-producto';

export interface EditarProductoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editing: Product | null;
  readonly conversionEnabled?: boolean;
  readonly testID?: string;
}

export interface FormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  usoProducto: UsoProducto;
  unidad: InventoryUnit;
  umbralStockBajo: string;
  colorFondo: ProductColor;
}

export interface EditFormErrors {
  nombre?: string;
  umbral?: string;
}

export type T = ReturnType<typeof useTranslation>['t'];

function fromProduct(p: Product | null): FormState {
  if (!p) {
    return {
      nombre: '',
      sku: '',
      categoria: 'Otro',
      usoProducto: 'venta',
      unidad: 'pza',
      umbralStockBajo: '3',
      colorFondo: 'white',
    };
  }
  return {
    nombre: p.nombre,
    sku: p.sku ?? '',
    categoria: p.categoria,
    usoProducto: p.usoProducto ?? 'venta',
    unidad: p.unidad,
    umbralStockBajo: String(p.umbralStockBajo),
    colorFondo: p.colorFondo ?? 'white',
  };
}

function buildPatch(state: FormState): ProductPatch {
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() === '' ? null : state.sku.trim(),
    categoria: state.categoria,
    usoProducto: state.usoProducto,
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
  useEffect(() => {
    setState(fromProduct(editing));
    setErrors({});
  }, [editing]);
  const patch = (next: Partial<FormState>): void => setState((prev) => ({ ...prev, ...next }));
  const handleSubmit = (): void => {
    if (!editing) return;
    const v: EditFormErrors = {};
    if (!state.nombre.trim()) v.nombre = t('validation.required');
    const u = Number(state.umbralStockBajo);
    if (!Number.isInteger(u) || u < 0) v.umbral = t('validation.invalidNumber');
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    editar.mutate({ id: editing.id, patch: buildPatch(state) }, { onSuccess: () => onClose() });
  };
  return { state, errors, patch, handleSubmit, saving: editar.isPending };
}

function EditFormFields(props: EditFieldsProps): ReactElement {
  return (
    <>
      <EditIdentityFields {...props} />
      <EditStockFields {...props} />
    </>
  );
}

export function EditarProductoModal(props: EditarProductoModalProps): ReactElement {
  const { t } = useTranslation();
  const { state, errors, patch, handleSubmit, saving } = useEditarProductoForm(
    props.editing,
    props.onClose,
  );
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('editarProducto.title')}
      testID={props.testID ?? 'editar-producto-modal'}
    >
      <EditFormFields
        state={state}
        errors={errors}
        patch={patch}
        conversionEnabled={props.conversionEnabled === true}
        t={t}
        onSubmit={handleSubmit}
      />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={saving}
        fullWidth
        testID="editar-producto-submit"
      >
        {t('editarProducto.save')}
      </Btn>
    </Modal>
  );
}

/**
 * EditarEgresoModal — partial-edit form behind the Egresos
 * swipe-to-edit gesture (Audit Round 2 J2, Phase K wiring).
 *
 * Pre-populates from the supplied `editing` Expense and submits the
 * diff via `useEditarEgreso`. Egresos are sub-typed
 * (Gasto / Nómina / Inventario-purchase) but the editable fields
 * (concepto, monto, proveedor, fecha, categoria) are shared across
 * sub-types — sub-type-specific edits land in a Phase 2 follow-up.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { fromPesos, toPesosString, type Expense, type ExpenseCategory } from '@cachink/domain';
import type { ExpensePatch } from '@cachink/data';
import { Btn, Modal } from '../../components/index';
import { Input } from '../../components/Input/index';
import { MoneyField, TextField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { useEditarEgreso } from '../../hooks/use-editar-egreso';

export interface EditarEgresoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly editing: Expense | null;
  readonly testID?: string;
}

const CATEGORIAS: readonly ExpenseCategory[] = [
  'Materia Prima',
  'Inventario',
  'Nómina',
  'Renta',
  'Servicios',
  'Publicidad',
  'Mantenimiento',
  'Impuestos',
  'Logística',
  'Otro',
];

interface FormState {
  concepto: string;
  categoria: ExpenseCategory;
  montoPesos: string;
  proveedor: string;
}

function fromExpense(e: Expense | null): FormState {
  if (!e) return { concepto: '', categoria: 'Otro', montoPesos: '', proveedor: '' };
  return {
    concepto: e.concepto,
    categoria: e.categoria,
    montoPesos: toPesosString(e.monto),
    proveedor: e.proveedor ?? '',
  };
}

type Patch = (next: Partial<FormState>) => void;
type T = ReturnType<typeof useTranslation>['t'];

interface FieldsCommonProps {
  readonly state: FormState;
  readonly patch: Patch;
  readonly t: T;
}

function ConceptoFields({ state, patch, t }: FieldsCommonProps): ReactElement {
  return (
    <>
      <TextField
        label={t('editarEgreso.conceptoLabel')}
        value={state.concepto}
        onChange={(v) => patch({ concepto: v })}
        testID="editar-egreso-concepto"
        returnKeyType="next"
      />
      <Input
        type="select"
        label={t('nuevaVenta.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => patch({ categoria: v as ExpenseCategory })}
        options={CATEGORIAS}
        testID="editar-egreso-categoria"
      />
    </>
  );
}

function MontoAndProveedor({
  state,
  patch,
  t,
  onSubmit,
}: FieldsCommonProps & { onSubmit: () => void }): ReactElement {
  return (
    <>
      <MoneyField
        label={t('editarEgreso.montoLabel')}
        value={state.montoPesos}
        onChange={(v) => patch({ montoPesos: v })}
        testID="editar-egreso-monto"
        returnKeyType="next"
      />
      <TextField
        label={t('editarEgreso.proveedorLabel')}
        value={state.proveedor}
        onChange={(v) => patch({ proveedor: v })}
        testID="editar-egreso-proveedor"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        blurOnSubmit
      />
    </>
  );
}

function buildPatch(state: FormState): ExpensePatch {
  return {
    concepto: state.concepto.trim(),
    categoria: state.categoria,
    monto: fromPesos(state.montoPesos),
    proveedor: state.proveedor.trim() === '' ? null : state.proveedor.trim(),
  };
}

export function EditarEgresoModal(props: EditarEgresoModalProps): ReactElement {
  const { t } = useTranslation();
  const editar = useEditarEgreso();
  const [state, setState] = useState<FormState>(fromExpense(props.editing));
  useEffect(() => {
    setState(fromExpense(props.editing));
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
      title={t('editarEgreso.title')}
      testID={props.testID ?? 'editar-egreso-modal'}
    >
      <ConceptoFields state={state} patch={patch} t={t} />
      <MontoAndProveedor state={state} patch={patch} t={t} onSubmit={handleSubmit} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={editar.isPending}
        fullWidth
        testID="editar-egreso-submit"
      >
        {t('editarEgreso.save')}
      </Btn>
    </Modal>
  );
}

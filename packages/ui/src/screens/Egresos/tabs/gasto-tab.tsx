/**
 * GastoTab — Gasto form inside NuevoEgresoModal (Slice 2 C3, M4-T02).
 *
 * Fields: concepto, categoria (EGRESO_CAT minus Nómina + Inventario),
 * monto, proveedor (optional), fecha (today by default).
 *
 * Pure UI: submit bubbles a NewExpense payload via `onSubmit`. Parent
 * wires `useRegistrarEgreso` + closes the modal on success.
 */

import { useState, type ReactElement } from 'react';
import {
  NewExpenseSchema,
  fromPesos,
  type BusinessId,
  type ExpenseCategory,
  type IsoDate,
  type NewExpense,
} from '@cachink/domain';
import { Btn, Input } from '../../../components/index';
import { useTranslation } from '../../../i18n/index';

/** Gasto-only categories (Nómina + Inventario live in their own tabs). */
export const GASTO_CATEGORIAS: readonly ExpenseCategory[] = [
  'Renta',
  'Servicios',
  'Publicidad',
  'Mantenimiento',
  'Impuestos',
  'Logística',
  'Materia Prima',
  'Otro',
];

export interface GastoTabProps {
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly onSubmit: (input: NewExpense) => void;
  readonly submitting?: boolean;
}

interface FormState {
  concepto: string;
  categoria: ExpenseCategory;
  montoPesos: string;
  proveedor: string;
}

interface FormErrors {
  concepto?: string;
  monto?: string;
}

function initialState(): FormState {
  return { concepto: '', categoria: 'Otro', montoPesos: '', proveedor: '' };
}

function validate(state: FormState, requiredLabel: string): FormErrors {
  const errors: FormErrors = {};
  if (!state.concepto.trim()) errors.concepto = requiredLabel;
  const m = Number(state.montoPesos);
  if (!Number.isFinite(m) || m <= 0) errors.monto = requiredLabel;
  return errors;
}

function buildPayload(state: FormState, businessId: BusinessId, fecha: IsoDate): NewExpense {
  return NewExpenseSchema.parse({
    fecha,
    concepto: state.concepto.trim(),
    categoria: state.categoria,
    monto: fromPesos(state.montoPesos),
    proveedor: state.proveedor.trim() || undefined,
    businessId,
  });
}

interface GastoFieldsProps {
  readonly state: FormState;
  readonly update: (partial: Partial<FormState>) => void;
  readonly errors: FormErrors;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function GastoFields(props: GastoFieldsProps): ReactElement {
  const { state, update, errors, t } = props;
  return (
    <>
      <Input
        label={t('nuevoEgreso.conceptoLabel')}
        placeholder={t('nuevoEgreso.conceptoPlaceholder')}
        value={state.concepto}
        onChange={(v) => update({ concepto: v })}
        note={errors.concepto}
        testID="gasto-concepto"
      />
      <Input
        type="select"
        label={t('nuevoEgreso.categoriaLabel')}
        value={state.categoria}
        onChange={(v) => update({ categoria: v as ExpenseCategory })}
        options={GASTO_CATEGORIAS}
        testID="gasto-categoria"
      />
      <Input
        type="number"
        label={t('nuevoEgreso.montoLabel')}
        value={state.montoPesos}
        onChange={(v) => update({ montoPesos: v })}
        note={errors.monto}
        testID="gasto-monto"
      />
      <Input
        label={t('nuevoEgreso.proveedorLabel')}
        value={state.proveedor}
        onChange={(v) => update({ proveedor: v })}
        note={t('nuevoEgreso.proveedorOpcional')}
        testID="gasto-proveedor"
      />
    </>
  );
}

export function GastoTab(props: GastoTabProps): ReactElement {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (): void => {
    const v = validate(state, t('empleados.required'));
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    props.onSubmit(buildPayload(state, props.businessId, props.fecha));
    setState(initialState());
  };

  const update = (p: Partial<FormState>): void => setState((prev) => ({ ...prev, ...p }));

  return (
    <>
      <GastoFields state={state} update={update} errors={errors} t={t} />
      <Btn
        variant="primary"
        onPress={handleSubmit}
        disabled={props.submitting === true}
        fullWidth
        testID="gasto-submit"
      >
        {t('nuevoEgreso.save')}
      </Btn>
    </>
  );
}

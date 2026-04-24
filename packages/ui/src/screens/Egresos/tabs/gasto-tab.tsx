/**
 * GastoTab — Gasto form inside NuevoEgresoModal (Slice 2 C3 + C6,
 * M4-T02 + T03). Composes the extracted form state (./gasto-tab-form)
 * with the field sub-components (./gasto-tab-fields) to stay inside
 * the 200-line file budget.
 *
 * Submit bubbles { egreso, recurrente? } so the parent can fire two
 * mutations when the toggle is on.
 */

import type { ReactElement } from 'react';
import type { BusinessId, IsoDate, NewExpense, NewRecurringExpense } from '@cachink/domain';
import { Btn } from '../../../components/index';
import { useTranslation } from '../../../i18n/index';
import { GastoRecurrenteFields, buildRecurrenteDraft } from './gasto-recurrente';
import { GastoFields, RecurrenteToggle } from './gasto-tab-fields';
import { buildEgreso, useGastoForm, validateGasto, type GastoFormApi } from './gasto-tab-form';

export { GASTO_CATEGORIAS } from './gasto-tab-form';

export interface GastoSubmitPayload {
  readonly egreso: NewExpense;
  readonly recurrente?: NewRecurringExpense;
}

export interface GastoTabProps {
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly onSubmit: (input: GastoSubmitPayload) => void;
  readonly submitting?: boolean;
}

function makePayload(
  form: GastoFormApi,
  businessId: BusinessId,
  fecha: IsoDate,
): GastoSubmitPayload {
  const egreso = buildEgreso(form.state, businessId, fecha);
  if (!form.state.recurrente) return { egreso };
  const recurrente = buildRecurrenteDraft(
    form.recurrenteState,
    {
      concepto: egreso.concepto,
      categoria: egreso.categoria,
      montoCentavos: egreso.monto,
      proveedor: egreso.proveedor,
      businessId: egreso.businessId,
    },
    egreso.fecha,
  );
  return recurrente ? { egreso, recurrente } : { egreso };
}

export function GastoTab(props: GastoTabProps): ReactElement {
  const { t } = useTranslation();
  const form = useGastoForm();

  const handleSubmit = (): void => {
    const v = validateGasto(form.state, t('empleados.required'));
    if (Object.keys(v).length > 0) {
      form.setErrors(v);
      return;
    }
    props.onSubmit(makePayload(form, props.businessId, props.fecha));
    form.reset();
  };

  return (
    <>
      <GastoFields state={form.state} update={form.update} errors={form.errors} t={t} />
      <RecurrenteToggle
        value={form.state.recurrente}
        onChange={(next) => form.update({ recurrente: next })}
        t={t}
      />
      {form.state.recurrente && (
        <GastoRecurrenteFields state={form.recurrenteState} update={form.updateRecurrente} />
      )}
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

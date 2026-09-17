/**
 * NominaTab — Nómina form inside NuevoEgresoModal (Slice 2 C4).
 *
 * Fields: empleado (select), periodo (auto from empleado, overridable),
 * monto (pre-fills from empleado.salario, editable).
 *
 * Empty-state: employees are managed in the portal and arrive by sync
 * (download-only on the device), so the tab says where to add them instead
 * of creating one locally — a device-created employee would be refused by
 * the server.
 *
 * Submit creates an Egreso with categoria="Nómina" — same use-case,
 * different categoria.
 */

import { useEffect, useState, type ReactElement } from 'react';
import {
  NewExpenseSchema,
  fromPesos,
  type BusinessId,
  type Employee,
  type IsoDate,
  type NewExpense,
} from '@xangarro/domain';
import { Btn, Combobox, EmptyState } from '../../../components/index';
import { MoneyField } from '../../../components/fields/index';
import { useTranslation } from '../../../i18n/index';

export interface NominaTabProps {
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly empleados: readonly Employee[];
  readonly onSubmit: (input: NewExpense) => void;
  readonly submitting?: boolean;
}

function useNominaState(empleados: readonly Employee[]): {
  empleadoId: string;
  setEmpleadoId: (v: string) => void;
  montoPesos: string;
  setMontoPesos: (v: string) => void;
} {
  const [empleadoId, setEmpleadoId] = useState('');
  const [montoPesos, setMontoPesos] = useState('');
  // Auto-prefill monto when an empleado is picked.
  useEffect(() => {
    if (!empleadoId) return;
    const emp = empleados.find((e) => e.id === empleadoId);
    if (emp) setMontoPesos((Number(emp.salarioCentavos) / 100).toString());
  }, [empleadoId, empleados]);
  return { empleadoId, setEmpleadoId, montoPesos, setMontoPesos };
}

function buildNominaPayload(
  empleadoId: string,
  empleados: readonly Employee[],
  montoPesos: string,
  businessId: BusinessId,
  fecha: IsoDate,
): NewExpense | null {
  const emp = empleados.find((e) => e.id === empleadoId);
  if (!emp) return null;
  return NewExpenseSchema.parse({
    fecha,
    concepto: `Nómina ${emp.nombre}`,
    categoria: 'Nómina',
    monto: fromPesos(montoPesos),
    businessId,
  });
}

function EmptyEmpleados({ t }: { t: ReturnType<typeof useTranslation>['t'] }): ReactElement {
  return (
    <EmptyState
      icon="users"
      title={t('nuevoEgreso.sinEmpleados')}
      description={t('nuevoEgreso.sinEmpleadosHint')}
      testID="nomina-sin-empleados"
    />
  );
}

type NominaState = ReturnType<typeof useNominaState>;

interface NominaFormProps {
  state: NominaState;
  empleados: readonly Employee[];
  t: ReturnType<typeof useTranslation>['t'];
  error: string | undefined;
  submitting: boolean;
  onSubmit: () => void;
}

function NominaForm(props: NominaFormProps): ReactElement {
  const { state, empleados, t, error, submitting, onSubmit } = props;
  return (
    <>
      <Combobox
        label={t('nuevoEgreso.empleadoLabel')}
        value={state.empleadoId}
        onChange={state.setEmpleadoId}
        options={empleados.map((e) => ({
          key: e.id,
          label: `${e.nombre} — ${e.puesto}`,
        }))}
        note={error}
        testID="nomina-empleado"
      />
      <MoneyField
        label={t('nuevoEgreso.montoLabel')}
        value={state.montoPesos}
        onChange={state.setMontoPesos}
        testID="nomina-monto"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      <Btn
        variant="primary"
        onPress={onSubmit}
        loading={submitting}
        fullWidth
        testID="nomina-submit"
      >
        {t('nuevoEgreso.save')}
      </Btn>
    </>
  );
}

export function NominaTab(props: NominaTabProps): ReactElement {
  const { t } = useTranslation();
  const s = useNominaState(props.empleados);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (): void => {
    const payload = s.empleadoId
      ? buildNominaPayload(
          s.empleadoId,
          props.empleados,
          s.montoPesos,
          props.businessId,
          props.fecha,
        )
      : null;
    if (!payload) {
      setError(t('nuevoEgreso.empleadoRequired'));
      return;
    }
    setError(undefined);
    props.onSubmit(payload);
  };

  if (props.empleados.length === 0) return <EmptyEmpleados t={t} />;
  return (
    <NominaForm
      state={s}
      empleados={props.empleados}
      t={t}
      error={error}
      submitting={props.submitting === true}
      onSubmit={handleSubmit}
    />
  );
}

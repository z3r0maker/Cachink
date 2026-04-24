/**
 * NominaTab — Nómina form inside NuevoEgresoModal (Slice 2 C4).
 *
 * Fields: empleado (select), periodo (auto from empleado, overridable),
 * monto (pre-fills from empleado.salario, editable).
 *
 * Empty-state: when no empleados exist, shows a "Crear empleado" Btn
 * that opens NuevoEmpleadoModal. Creating an empleado mid-flow
 * auto-selects them.
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
  type EmployeeId,
  type IsoDate,
  type NewExpense,
} from '@cachink/domain';
import { Btn, Input } from '../../../components/index';
import { useTranslation } from '../../../i18n/index';
import { NuevoEmpleadoModal } from './nuevo-empleado-modal';

export interface NominaTabProps {
  readonly businessId: BusinessId;
  readonly fecha: IsoDate;
  readonly empleados: readonly Employee[];
  readonly onSubmit: (input: NewExpense) => void;
  readonly onCrearEmpleado?: (draft: {
    readonly nombre: string;
    readonly puesto: string;
    readonly salario: bigint;
    readonly periodo: Employee['periodo'];
  }) => Promise<Employee | void>;
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

function EmptyEmpleados({
  onCrearEmpleado,
  t,
}: {
  onCrearEmpleado: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <Btn variant="soft" onPress={onCrearEmpleado} fullWidth testID="nomina-crear-empleado">
      {t('nuevoEgreso.crearEmpleado')}
    </Btn>
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
      <Input
        type="select"
        label={t('nuevoEgreso.empleadoLabel')}
        value={state.empleadoId}
        onChange={state.setEmpleadoId}
        options={empleados.map((e) => e.id)}
        note={error}
        testID="nomina-empleado"
      />
      <Input
        type="number"
        label={t('nuevoEgreso.montoLabel')}
        value={state.montoPesos}
        onChange={state.setMontoPesos}
        testID="nomina-monto"
      />
      <Btn
        variant="primary"
        onPress={onSubmit}
        disabled={submitting}
        fullWidth
        testID="nomina-submit"
      >
        {t('nuevoEgreso.save')}
      </Btn>
    </>
  );
}

function useEmpleadoModal(
  onCrearEmpleado: NominaTabProps['onCrearEmpleado'],
  setEmpleadoId: (v: string) => void,
): {
  open: boolean;
  openModal: () => void;
  close: () => void;
  handleCreated: (
    input: Parameters<NonNullable<NominaTabProps['onCrearEmpleado']>>[0],
  ) => Promise<void>;
} {
  const [open, setOpen] = useState(false);
  async function handleCreated(
    input: Parameters<NonNullable<NominaTabProps['onCrearEmpleado']>>[0],
  ): Promise<void> {
    const created = await onCrearEmpleado?.(input);
    if (created && 'id' in created) setEmpleadoId(created.id as EmployeeId);
    setOpen(false);
  }
  return {
    open,
    openModal: () => setOpen(true),
    close: () => setOpen(false),
    handleCreated,
  };
}

function EmptyEmpleadosBranch({
  modal,
  t,
}: {
  modal: ReturnType<typeof useEmpleadoModal>;
  t: ReturnType<typeof useTranslation>['t'];
}): ReactElement {
  return (
    <>
      <EmptyEmpleados onCrearEmpleado={modal.openModal} t={t} />
      <NuevoEmpleadoModal
        open={modal.open}
        onClose={modal.close}
        onSubmit={(input) => void modal.handleCreated(input)}
      />
    </>
  );
}

export function NominaTab(props: NominaTabProps): ReactElement {
  const { t } = useTranslation();
  const s = useNominaState(props.empleados);
  const modal = useEmpleadoModal(props.onCrearEmpleado, s.setEmpleadoId);
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

  if (props.empleados.length === 0) return <EmptyEmpleadosBranch modal={modal} t={t} />;
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

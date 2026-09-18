/**
 * The payroll roster (P-12): add, edit and remove employees from the portal.
 * `employees` is a DOWN table — the phone's Gastos → Nómina reads the list —
 * so the repository behind these logs every write for the devices.
 *
 * The form arrives as typed (salary in pesos); the rules turn it into the
 * domain's shape or name every field that is wrong at once.
 */

import type { EmployeesRepository } from '@xangarro/data';
import {
  EmpleadoInvalidoError,
  EmpleadoNoEncontradoError,
  PayrollFrequencyEnum,
  pesosToCentavos,
  type BusinessId,
  type EmployeeId,
  type PayrollFrequency,
} from '@xangarro/domain';

import type { UseCase } from '../_use-case.js';

export interface EmpleadoForm {
  readonly nombre: string;
  readonly puesto: string;
  /** Pesos as typed, e.g. `4500.50`. */
  readonly salario: string;
  readonly periodo: string;
}

interface Valid {
  readonly nombre: string;
  readonly puesto: string;
  readonly salarioCentavos: bigint;
  readonly periodo: PayrollFrequency;
}

function validate(form: EmpleadoForm): Valid {
  const campos: Record<string, string> = {};
  const nombre = form.nombre.trim();
  const puesto = form.puesto.trim();
  const salarioCentavos = pesosToCentavos(form.salario);
  const periodo = PayrollFrequencyEnum.safeParse(form.periodo);
  if (nombre.length === 0 || nombre.length > 120) campos.nombre = 'Escribe el nombre.';
  if (puesto.length === 0 || puesto.length > 80) campos.puesto = 'Escribe el puesto.';
  if (salarioCentavos === null) campos.salario = 'Escribe el salario, por ejemplo 2100.00';
  if (!periodo.success) campos.periodo = 'Elige cada cuánto le pagas.';
  if (Object.keys(campos).length > 0 || salarioCentavos === null || !periodo.success) {
    throw new EmpleadoInvalidoError(campos);
  }
  return { nombre, puesto, salarioCentavos, periodo: periodo.data };
}

type Repo = Pick<EmployeesRepository, 'create' | 'update' | 'findById' | 'delete'>;

export interface GuardarEmpleadoInput {
  readonly businessId: BusinessId;
  /** Null creates; an id edits that employee. */
  readonly id: EmployeeId | null;
  readonly form: EmpleadoForm;
}

export class GuardarEmpleadoUseCase implements UseCase<GuardarEmpleadoInput, EmployeeId> {
  constructor(private readonly employees: Repo) {}

  async execute(input: GuardarEmpleadoInput): Promise<EmployeeId> {
    const valid = validate(input.form);
    if (input.id === null) {
      return (await this.employees.create({ ...valid, businessId: input.businessId })).id;
    }
    if ((await this.employees.findById(input.id)) === null) {
      throw new EmpleadoNoEncontradoError(input.id);
    }
    return (await this.employees.update(input.id, valid)).id;
  }
}

/** «Dar de baja»: a soft delete — past nómina gastos keep their meaning. */
export class DarDeBajaEmpleadoUseCase implements UseCase<EmployeeId, void> {
  constructor(private readonly employees: Pick<Repo, 'findById' | 'delete'>) {}

  async execute(id: EmployeeId): Promise<void> {
    if ((await this.employees.findById(id)) === null) throw new EmpleadoNoEncontradoError(id);
    await this.employees.delete(id);
  }
}

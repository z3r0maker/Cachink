import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import type { EmployeesRepository } from '@xangarro/data';
import {
  EmpleadoInvalidoError,
  EmpleadoNoEncontradoError,
  type BusinessId,
  type Employee,
  type EmployeeId,
} from '@xangarro/domain';

import {
  DarDeBajaEmpleadoUseCase,
  GuardarEmpleadoUseCase,
  type EmpleadoForm,
} from '../src/empleados/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const ID = '01HZ8XQN9GZJXV8AKQ5X0EMP01' as EmployeeId;

function repo(existing: boolean) {
  const calls: string[] = [];
  const r: Pick<EmployeesRepository, 'create' | 'update' | 'findById' | 'delete'> = {
    create: async (i) => {
      calls.push(`create:${i.nombre}:${i.periodo}:${i.salarioCentavos}`);
      return { id: ID } as Employee;
    },
    update: async (id, p) => {
      calls.push(`update:${id}:${p.nombre}`);
      return { id } as Employee;
    },
    findById: async () => (existing ? ({ id: ID } as Employee) : null),
    delete: async (id) => {
      calls.push(`delete:${id}`);
    },
  };
  return { r, calls };
}

const form: EmpleadoForm = {
  nombre: ' Rosa Medina ',
  puesto: 'Cocinera',
  salario: '4500.50',
  periodo: 'quincenal',
};

describe('GuardarEmpleadoUseCase', () => {
  it('creates with the salary in centavos and names trimmed', async () => {
    const { r, calls } = repo(false);
    await new GuardarEmpleadoUseCase(r).execute({ businessId: BIZ, id: null, form });
    assert.deepEqual(calls, ['create:Rosa Medina:quincenal:450050']);
  });

  it('edits an existing employee', async () => {
    const { r, calls } = repo(true);
    await new GuardarEmpleadoUseCase(r).execute({ businessId: BIZ, id: ID, form });
    assert.deepEqual(calls, [`update:${ID}:Rosa Medina`]);
  });

  it('refuses a blank name and a salary that is not money', async () => {
    const { r, calls } = repo(false);
    const err = await new GuardarEmpleadoUseCase(r)
      .execute({ businessId: BIZ, id: null, form: { ...form, nombre: ' ', salario: 'mucho' } })
      .catch((e: unknown) => e);
    assert.ok(err instanceof EmpleadoInvalidoError);
    assert.deepEqual(Object.keys(err.campos).sort(), ['nombre', 'salario']);
    assert.deepEqual(calls, []);
  });

  it('refuses an unknown periodo', async () => {
    const { r } = repo(false);
    await assert.rejects(
      new GuardarEmpleadoUseCase(r).execute({
        businessId: BIZ,
        id: null,
        form: { ...form, periodo: 'diario' },
      }),
      EmpleadoInvalidoError,
    );
  });

  it('refuses editing someone no longer on the roster', async () => {
    const { r } = repo(false);
    await assert.rejects(
      new GuardarEmpleadoUseCase(r).execute({ businessId: BIZ, id: ID, form }),
      EmpleadoNoEncontradoError,
    );
  });
});

describe('DarDeBajaEmpleadoUseCase', () => {
  it('soft-deletes an employee on the roster', async () => {
    const { r, calls } = repo(true);
    await new DarDeBajaEmpleadoUseCase(r).execute(ID);
    assert.deepEqual(calls, [`delete:${ID}`]);
  });

  it('refuses one already gone', async () => {
    const { r } = repo(false);
    await assert.rejects(new DarDeBajaEmpleadoUseCase(r).execute(ID), EmpleadoNoEncontradoError);
  });
});

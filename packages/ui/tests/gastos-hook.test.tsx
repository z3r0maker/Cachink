/**
 * `useGastos` (Track M, M-08) over the in-memory repositories: the read the
 * screen shows — the turno's gastos said the operator's way, the due
 * recurrentes, the session's names — and the write path behind its sheets:
 * a plain gasto through the egreso use case, a due recurrente through the one
 * that also advances its schedule.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import { hoyLocal } from '@xangarro/caja';
import type { BusinessId, IsoDate, UserId } from '@xangarro/domain';
import {
  InMemoryCajaTurnosRepository,
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  makeNewExpense,
  makeNewRecurringExpense,
  TEST_DEVICE_ID,
  type RecurringExpense,
} from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { initI18n } from '../src/i18n/index';
import { useGastos } from '../src/screens/Gastos/use-gastos';
import { tamaguiConfig } from '../src/tamagui.config';

initI18n();

vi.mock('../src/screens/AppShell/use-shell-data', () => ({
  useShellData: () => ({
    caja: 'Caja 1',
    negocio: 'Taquería Don Pedro',
    operador: { nombre: 'Ana Robledo', iniciales: 'AR' },
    turnoDesde: '08:15',
  }),
}));

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7ME0' as UserId;
const HOY = hoyLocal() as IsoDate;

let cajaTurnos: InMemoryCajaTurnosRepository;
let expenses: InMemoryExpensesRepository;
let recurring: InMemoryRecurringExpensesRepository;
let plantilla: RecurringExpense;

beforeEach(async () => {
  cajaTurnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
  expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
  recurring = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
  const turno = await cajaTurnos.create({
    userId: USER,
    fecha: HOY,
    aperturaAt: `${HOY}T08:15:00.000Z`,
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 0n,
    businessId: BIZ,
  });
  await expenses.create(
    makeNewExpense({
      fecha: HOY,
      concepto: 'Carbón',
      categoria: 'Materia Prima',
      monto: 240_00n,
      proveedor: 'Carbonería La Flama',
      cajaTurnoId: turno.id,
      businessId: BIZ,
    }),
  );
  plantilla = await recurring.create(
    makeNewRecurringExpense({
      concepto: 'Gas del local',
      categoria: 'Materia Prima',
      montoCentavos: 350_00n,
      frecuencia: 'semanal',
      diaDeLaSemana: 5,
      proximoDisparo: HOY,
      businessId: BIZ,
    }),
  );
  useAppConfigStore.setState({ currentBusinessId: BIZ, userId: USER, hydrated: true });
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider overrides={{ cajaTurnos, expenses, recurringExpenses: recurring }}>
          {children}
        </MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
  return renderHook(() => useGastos(), { wrapper });
}

describe('useGastos · la lectura', () => {
  it('says the turno gastos the operator way, with the session names', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const data = result.current.data;
    expect(data?.operador).toBe('Ana Robledo');
    expect(data?.caja).toBe('Caja 1');
    expect(data?.gastos.map((g) => g.concepto)).toEqual(['Carbón']);
    expect(data?.gastos[0]?.categoria).toBe('Insumos');
    expect(data?.gastos[0]?.detalle).toBe('Carbonería La Flama');
    expect(data?.dueno).toBe('el dueño');
  });

  it('carries the due recurrente with the prefill its sheet opens with', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const x = result.current.porPagar?.[0];
    expect(x?.para.concepto).toBe('Gas del local');
    expect(x?.prefill.recurrenteId).toBe(plantilla.id);
    expect(x?.prefill.categoria).toBe('Insumos');
    expect(x?.prefill.monto).toBe(350_00n);
  });
});

describe('useGastos · la escritura', () => {
  it('a plain gasto lands on the turno list', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    await result.current.registrar({
      monto: 150_00n,
      concepto: 'Hielo',
      categoria: 'Otros',
      proveedor: null,
      foto: null,
    });
    await waitFor(() =>
      expect(result.current.data?.gastos.map((g) => g.concepto)).toContain('Hielo'),
    );
  });

  it('paying the recurrente records the egreso and advances the schedule', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    await result.current.registrar({
      monto: 350_00n,
      concepto: 'Gas del local',
      categoria: 'Insumos',
      proveedor: 'Gas Express',
      foto: null,
      recurrenteId: plantilla.id,
    });
    await waitFor(() => expect(result.current.porPagar).toEqual([]));
    const despues = await recurring.findById(plantilla.id);
    const en7 = new Date(`${HOY}T00:00:00.000Z`);
    en7.setUTCDate(en7.getUTCDate() + 7);
    expect(despues?.proximoDisparo).toBe(en7.toISOString().slice(0, 10));
  });
});

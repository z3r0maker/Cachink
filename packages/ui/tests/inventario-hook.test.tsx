/**
 * `useInventario` (Track M, M-09) over the in-memory repositories: the read
 * the screen shows — the stocked products with their ledger count, this
 * turno's manual movements said the operator's way, the session's names —
 * and the write behind its sheets, which mirrors the web operador's
 * `moverInventario`: the screen's kind through `movimientoDominio`, at the
 * product's cost, through the movement use case.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from '@tamagui/core';
import { hoyLocal } from '@xangarro/caja';
import type { BusinessId, IsoDate, ProductId, UserId } from '@xangarro/domain';
import {
  InMemoryAppConfigRepository,
  InMemoryCajaTurnosRepository,
  InMemoryExpensesRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
} from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import { useAppConfigStore } from '../src/app-config/use-app-config';
import { initI18n } from '../src/i18n/index';
import { useInventario } from '../src/screens/Inventario/use-inventario';
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

let products: InMemoryProductsRepository;
let movements: InMemoryInventoryMovementsRepository;
let expenses: InMemoryExpensesRepository;
let turnos: InMemoryCajaTurnosRepository;
let appConfig: InMemoryAppConfigRepository;
let pastorId: ProductId;

async function sembrar(): Promise<void> {
  await turnos.create({
    userId: USER,
    fecha: HOY,
    aperturaAt: `${HOY}T00:05:00.000Z`,
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 0n,
    businessId: BIZ,
  });
  const pastor = await products.create(
    makeNewProduct({
      nombre: 'Carne de pastor',
      businessId: BIZ,
      unidad: 'kg',
      umbralStockBajo: 15,
    }),
  );
  const tortilla = await products.create(
    makeNewProduct({
      nombre: 'Tortilla de maíz',
      businessId: BIZ,
      unidad: 'pza',
      umbralStockBajo: 200,
    }),
  );
  await products.create(
    makeNewProduct({ nombre: 'Servicio de catering', businessId: BIZ, seguirStock: false }),
  );
  pastorId = pastor.id;
  await movements.create({
    productoId: pastor.id,
    fecha: HOY,
    tipo: 'entrada',
    cantidad: 15,
    costoUnitCentavos: 180_00n,
    motivo: 'Compra a proveedor',
    nota: 'Carnicería La Central',
    origen: 'manual',
    businessId: BIZ,
  });
  await movements.create({
    productoId: pastor.id,
    fecha: HOY,
    tipo: 'salida',
    cantidad: 3,
    costoUnitCentavos: 180_00n,
    motivo: 'Venta',
    origen: 'venta',
    businessId: BIZ,
  });
  await movements.create({
    productoId: tortilla.id,
    fecha: HOY,
    tipo: 'salida',
    cantidad: 2,
    costoUnitCentavos: 3_00n,
    motivo: 'Merma / daño',
    nota: 'Se rompió',
    origen: 'manual',
    businessId: BIZ,
  });
}

beforeEach(async () => {
  products = new InMemoryProductsRepository(TEST_DEVICE_ID);
  movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
  expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
  turnos = new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
  appConfig = new InMemoryAppConfigRepository();
  await appConfig.set(SYNC_CONFIG_KEYS.duenoNombre, 'Pedro Sánchez');
  await sembrar();
  useAppConfigStore.setState({
    currentBusinessId: BIZ,
    userId: USER,
    deviceId: TEST_DEVICE_ID,
    hydrated: true,
  });
});

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <QueryClientProvider client={qc}>
        <MockRepositoryProvider
          overrides={{
            products,
            inventoryMovements: movements,
            expenses,
            cajaTurnos: turnos,
            appConfig,
          }}
        >
          {children}
        </MockRepositoryProvider>
      </QueryClientProvider>
    </TamaguiProvider>
  );
  return renderHook(() => useInventario(), { wrapper });
}

describe('useInventario · la lectura', () => {
  it('says the tracked products with their ledger count, untracked ones out', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const items = result.current.data?.existencias ?? [];
    expect(items.map((i) => i.nombre)).toEqual(['Carne de pastor', 'Tortilla de maíz']);
    expect(items[0]).toMatchObject({
      existencias: 12,
      umbral: 15,
      unidad: 'kg',
      corto: 'carne de pastor',
    });
    expect(items[1]).toMatchObject({ existencias: 0, unidad: 'piezas' });
  });

  it('says this turno manual movements: the entrada and the merma, never the venta', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    const movs = result.current.data?.movimientos ?? [];
    expect(movs.map((m) => m.tipo)).toEqual(['Entrada', 'Merma']);
    expect(movs[0]).toMatchObject({ detalle: 'Carnicería La Central', cantidad: 15 });
    expect(movs[1]).toMatchObject({ detalle: 'Se rompió', cantidad: 2 });
  });

  it('carries the session names and the owner first name', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    expect(result.current.data?.operador).toBe('Ana Robledo');
    expect(result.current.data?.caja).toBe('Caja 1');
    expect(result.current.dueno).toBe('Pedro');
  });
});

describe('useInventario · la escritura', () => {
  it('an entrada records the movement at cost, its expense, and refreshes the read', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    await result.current.registrar({
      tipo: 'Entrada',
      existenciaId: pastorId,
      cantidad: 5,
      detalle: 'Carnicería La Central',
    });
    await waitFor(() =>
      expect(result.current.data?.existencias.find((i) => i.id === pastorId)?.existencias).toBe(17),
    );
    const movs = await movements.findByProduct(pastorId);
    const entrada = movs.find((m) => m.origen === 'manual' && m.tipo === 'entrada');
    expect(entrada).toMatchObject({ motivo: 'Compra a proveedor', nota: 'Carnicería La Central' });
    const gastos = await expenses.findByDateRange(HOY, HOY, BIZ);
    expect(gastos.some((g) => g.concepto === 'Compra inventario: Compra a proveedor')).toBe(true);
  });

  it('a merma records the salida with its motivo and writes no expense', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    await result.current.registrar({
      tipo: 'Merma',
      existenciaId: pastorId,
      cantidad: 2,
      detalle: 'Se echó a perder',
    });
    await waitFor(() =>
      expect(result.current.data?.existencias.find((i) => i.id === pastorId)?.existencias).toBe(10),
    );
    const movs = await movements.findByProduct(pastorId);
    expect(movs.some((m) => m.motivo === 'Merma / daño' && m.nota === 'Se echó a perder')).toBe(
      true,
    );
    const gastos = await expenses.findByDateRange(HOY, HOY, BIZ);
    expect(gastos.length).toBe(0);
  });

  it('refuses a decimal quantity, as the domain counts integers', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    await expect(
      result.current.registrar({
        tipo: 'Entrada',
        existenciaId: pastorId,
        cantidad: 1.5,
        detalle: '',
      }),
    ).rejects.toThrow('La cantidad debe ser un número entero mayor que cero');
  });

  it('refuses a product the catalogue no longer has', async () => {
    const { result } = montar();
    await waitFor(() => expect(result.current.state).toBe('happy'));
    await expect(
      result.current.registrar({
        tipo: 'Merma',
        existenciaId: '01HZ8XQN9GZJXV8AKQ5X0NOPE0',
        cantidad: 1,
        detalle: 'Se rompió',
      }),
    ).rejects.toThrow('Ese producto ya no está en el catálogo');
  });
});

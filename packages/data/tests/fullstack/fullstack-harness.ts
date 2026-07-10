/**
 * Fullstack test harness — builds `{ db, repos, useCases }` per test.
 *
 * Wires real use-cases to Drizzle repository implementations on a fresh
 * `:memory:` SQLite database with the consolidated migration applied.
 * Each call returns a completely isolated environment — no cross-test
 * leakage.
 *
 * Usage:
 * ```ts
 * import { buildHarness } from './fullstack-harness.js';
 *
 * let h: ReturnType<typeof buildHarness>;
 * beforeEach(() => { h = buildHarness(); });
 *
 * it('does something', async () => {
 *   await h.useCases.abrirCaja.execute({ ... });
 * });
 * ```
 */

import type { UserId } from '@cachink/domain';
import { makeFreshDb } from '../helpers/fresh-db.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import type { CachinkDatabase } from '../../src/repositories/drizzle/_db.js';

// Drizzle repositories
import {
  DrizzleSalesRepository,
  DrizzleBusinessesRepository,
  DrizzleProductsRepository,
  DrizzleClientsRepository,
  DrizzleClientPaymentsRepository,
  DrizzleExpensesRepository,
  DrizzleInventoryMovementsRepository,
  DrizzleCajaTurnosRepository,
  DrizzleCajaMovimientosRepository,
  DrizzleUsersRepository,
  DrizzleDayClosesRepository,
  DrizzleRecurringExpensesRepository,
  DrizzleConversionRecetasRepository,
  DrizzleConversionsRepository,
  DrizzleCancelacionLogsRepository,
} from '../../src/repositories/drizzle/index.js';

// Use-cases (relative path to sibling package — vitest resolves TS)
import {
  RegistrarVentaUseCase,
  CancelarVentaUseCase,
  EditarVentaUseCase,
  AbrirCajaUseCase,
  CerrarCajaUseCase,
  RetirarCajaUseCase,
  DepositarCajaUseCase,
  CerrarCorteDeDiaUseCase,
  RegistrarPagoClienteUseCase,
  RegistrarMovimientoInventarioUseCase,
  RegistrarEgresoUseCase,
  ProcesarGastoRecurrenteUseCase,
  DescartarGastoRecurrenteUseCase,
  GenerarInformeMensualUseCase,
  CrearUsuarioUseCase,
  AutenticarUsuarioUseCase,
  CambiarPinUseCase,
  RecuperarPinUseCase,
  EliminarUsuarioUseCase,
  ToggleFeatureFlagUseCase,
  EjecutarConversionUseCase,
} from '../../../application/src/index.js';

export interface FullstackHarness {
  readonly db: CachinkDatabase;
  readonly repos: FullstackRepos;
  readonly useCases: FullstackUseCases;
}

export interface FullstackRepos {
  readonly sales: DrizzleSalesRepository;
  readonly businesses: DrizzleBusinessesRepository;
  readonly products: DrizzleProductsRepository;
  readonly clients: DrizzleClientsRepository;
  readonly clientPayments: DrizzleClientPaymentsRepository;
  readonly expenses: DrizzleExpensesRepository;
  readonly movements: DrizzleInventoryMovementsRepository;
  readonly cajaTurnos: DrizzleCajaTurnosRepository;
  readonly cajaMovimientos: DrizzleCajaMovimientosRepository;
  readonly users: DrizzleUsersRepository;
  readonly dayCloses: DrizzleDayClosesRepository;
  readonly recurring: DrizzleRecurringExpensesRepository;
  readonly recetas: DrizzleConversionRecetasRepository;
  readonly conversions: DrizzleConversionsRepository;
  readonly cancelacionLogs: DrizzleCancelacionLogsRepository;
}

export interface FullstackUseCases {
  readonly registrarVenta: RegistrarVentaUseCase;
  readonly cancelarVenta: CancelarVentaUseCase;
  readonly editarVenta: EditarVentaUseCase;
  readonly abrirCaja: AbrirCajaUseCase;
  readonly cerrarCaja: CerrarCajaUseCase;
  readonly retirarCaja: RetirarCajaUseCase;
  readonly depositarCaja: DepositarCajaUseCase;
  readonly cerrarCorte: CerrarCorteDeDiaUseCase;
  readonly registrarPago: RegistrarPagoClienteUseCase;
  readonly registrarMovimiento: RegistrarMovimientoInventarioUseCase;
  readonly registrarEgreso: RegistrarEgresoUseCase;
  readonly procesarGastoRecurrente: ProcesarGastoRecurrenteUseCase;
  readonly descartarGastoRecurrente: DescartarGastoRecurrenteUseCase;
  readonly generarInforme: GenerarInformeMensualUseCase;
  readonly crearUsuario: CrearUsuarioUseCase;
  readonly autenticarUsuario: AutenticarUsuarioUseCase;
  readonly cambiarPin: CambiarPinUseCase;
  readonly recuperarPin: RecuperarPinUseCase;
  readonly eliminarUsuario: EliminarUsuarioUseCase;
  readonly toggleFeatureFlag: ToggleFeatureFlagUseCase;
  readonly ejecutarConversion: EjecutarConversionUseCase;
}

/**
 * Build a fresh fullstack test harness.
 *
 * @param userId — The userId to stamp on repos and use for RegistrarVenta's
 *   caja lookup. If null, caja-gated use-cases will throw.
 * @param stockEnabled — Whether the stock feature flag is ON for
 *   RegistrarVenta / CancelarVenta.
 */
export function buildHarness(opts?: {
  userId?: UserId | null;
  stockEnabled?: boolean;
}): FullstackHarness {
  const userId = opts?.userId ?? null;
  const stockEnabled = opts?.stockEnabled ?? true;

  const db = makeFreshDb();

  // --- Repositories ------------------------------------------------
  const repos: FullstackRepos = {
    sales: new DrizzleSalesRepository(db, TEST_DEVICE_ID, userId),
    businesses: new DrizzleBusinessesRepository(db, TEST_DEVICE_ID, userId),
    products: new DrizzleProductsRepository(db, TEST_DEVICE_ID, userId),
    clients: new DrizzleClientsRepository(db, TEST_DEVICE_ID, userId),
    clientPayments: new DrizzleClientPaymentsRepository(db, TEST_DEVICE_ID, userId),
    expenses: new DrizzleExpensesRepository(db, TEST_DEVICE_ID, userId),
    movements: new DrizzleInventoryMovementsRepository(db, TEST_DEVICE_ID, userId),
    cajaTurnos: new DrizzleCajaTurnosRepository(db, TEST_DEVICE_ID, userId),
    cajaMovimientos: new DrizzleCajaMovimientosRepository(db, TEST_DEVICE_ID, userId),
    users: new DrizzleUsersRepository(db, TEST_DEVICE_ID, userId),
    dayCloses: new DrizzleDayClosesRepository(db, TEST_DEVICE_ID, userId),
    recurring: new DrizzleRecurringExpensesRepository(db, TEST_DEVICE_ID, userId),
    recetas: new DrizzleConversionRecetasRepository(db, TEST_DEVICE_ID, userId),
    conversions: new DrizzleConversionsRepository(db, TEST_DEVICE_ID, userId),
    cancelacionLogs: new DrizzleCancelacionLogsRepository(db, TEST_DEVICE_ID, userId),
  };

  // --- Use-Cases ---------------------------------------------------
  const useCases: FullstackUseCases = {
    registrarVenta: new RegistrarVentaUseCase(
      repos.sales, repos.clients, repos.products, repos.movements, repos.cajaTurnos,
      { userId, stockEnabled },
    ),
    cancelarVenta: new CancelarVentaUseCase(
      repos.sales, repos.users, repos.products, repos.movements, repos.cancelacionLogs,
    ),
    editarVenta: new EditarVentaUseCase(repos.sales, repos.clients),
    abrirCaja: new AbrirCajaUseCase(repos.cajaTurnos),
    cerrarCaja: new CerrarCajaUseCase(repos.cajaTurnos, repos.sales, repos.expenses),
    retirarCaja: new RetirarCajaUseCase(repos.cajaMovimientos, repos.cajaTurnos),
    depositarCaja: new DepositarCajaUseCase(repos.cajaMovimientos, repos.cajaTurnos),
    cerrarCorte: new CerrarCorteDeDiaUseCase(repos.sales, repos.expenses, repos.dayCloses),
    registrarPago: new RegistrarPagoClienteUseCase(repos.clientPayments, repos.sales),
    registrarMovimiento: new RegistrarMovimientoInventarioUseCase(repos.movements, repos.expenses),
    registrarEgreso: new RegistrarEgresoUseCase(repos.expenses, repos.recurring),
    procesarGastoRecurrente: new ProcesarGastoRecurrenteUseCase(repos.expenses, repos.recurring),
    descartarGastoRecurrente: new DescartarGastoRecurrenteUseCase(repos.recurring),
    generarInforme: new GenerarInformeMensualUseCase(repos.sales, repos.expenses, repos.businesses),
    crearUsuario: new CrearUsuarioUseCase(repos.users),
    autenticarUsuario: new AutenticarUsuarioUseCase(repos.users),
    cambiarPin: new CambiarPinUseCase(repos.users),
    recuperarPin: new RecuperarPinUseCase(repos.users),
    eliminarUsuario: new EliminarUsuarioUseCase(repos.users),
    toggleFeatureFlag: new ToggleFeatureFlagUseCase(repos.businesses),
    ejecutarConversion: new EjecutarConversionUseCase(
      repos.recetas, repos.conversions, repos.movements, repos.products,
    ),
  };

  return { db, repos, useCases };
}

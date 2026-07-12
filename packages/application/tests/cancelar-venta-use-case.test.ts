/**
 * CancelarVentaUseCase tests.
 *
 * Happy path + unhappy paths per CLAUDE.md §6.
 * Tests PIN verification, permission check, stock reversal, and audit log.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, SaleId, UserId } from '@cachink/domain';
import {
  InMemoryCancelacionLogsRepository,
  InMemoryInventoryMovementsRepository,
  InMemoryProductsRepository,
  InMemorySalesRepository,
  InMemoryUsersRepository,
  TEST_DEVICE_ID,
  makeNewProduct,
  makeNewSale,
  makeNewUser,
} from '../../testing/src/index.js';
import { CrearUsuarioUseCase } from '../src/index.js';
import { CancelarVentaUseCase } from '../src/cancelar-venta/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('CancelarVentaUseCase', () => {
  let sales: InMemorySalesRepository;
  let users: InMemoryUsersRepository;
  let products: InMemoryProductsRepository;
  let movements: InMemoryInventoryMovementsRepository;
  let logs: InMemoryCancelacionLogsRepository;
  let crearUsuario: CrearUsuarioUseCase;
  let useCase: CancelarVentaUseCase;

  let directorId: UserId;

  beforeEach(async () => {
    sales = new InMemorySalesRepository(TEST_DEVICE_ID);
    users = new InMemoryUsersRepository(TEST_DEVICE_ID);
    products = new InMemoryProductsRepository(TEST_DEVICE_ID);
    movements = new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
    logs = new InMemoryCancelacionLogsRepository(TEST_DEVICE_ID);

    crearUsuario = new CrearUsuarioUseCase(users);
    useCase = new CancelarVentaUseCase(sales, users, products, movements, logs);

    // Seed a director user (bcrypt-hashed PIN via CrearUsuarioUseCase)
    const director = await crearUsuario.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Director Test',
        pin: '123456',
        role: 'director',
      }),
    );
    directorId = director.id;
  });

  it('cancels a cash sale and returns cashToReturn', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ, metodo: 'Efectivo', monto: 5000n }),
    );

    const result = await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'Cliente cambió de opinión',
      businessId: BIZ,
      stockEnabled: false,
    });

    expect(result.sale.id).toBe(sale.id);
    expect(result.cashToReturn).toBe(5000n);
    expect(result.stockReversed).toBe(false);
    expect(result.cantidadDevuelta).toBeNull();
  });

  it('returns null cashToReturn for non-cash sales', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ, metodo: 'Transferencia', monto: 3000n }),
    );

    const result = await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'Error en cobro',
      businessId: BIZ,
      stockEnabled: false,
    });

    expect(result.cashToReturn).toBeNull();
  });

  it('reverses stock when stock is enabled and product has seguirStock', async () => {
    const product = await products.create(
      makeNewProduct({ businessId: BIZ, seguirStock: true }),
    );
    const sale = await sales.create(
      makeNewSale({
        businessId: BIZ,
        productoId: product.id,
        cantidad: 3,
        metodo: 'Efectivo',
        monto: 1500n,
      }),
    );

    const result = await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'Devolución',
      businessId: BIZ,
      stockEnabled: true,
    });

    expect(result.stockReversed).toBe(true);
    expect(result.cantidadDevuelta).toBe(3);
  });

  it('does not reverse stock when product has seguirStock=false', async () => {
    const product = await products.create(
      makeNewProduct({ businessId: BIZ, seguirStock: false }),
    );
    const sale = await sales.create(
      makeNewSale({
        businessId: BIZ,
        productoId: product.id,
        cantidad: 2,
        metodo: 'Efectivo',
        monto: 900n,
      }),
    );

    const result = await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'Devolución',
      businessId: BIZ,
      stockEnabled: true,
    });

    expect(result.stockReversed).toBe(false);
    expect(result.cantidadDevuelta).toBeNull();
  });

  it('creates an audit log on successful cancellation', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ, metodo: 'Efectivo', monto: 2000n }),
    );

    await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'Producto defectuoso',
      businessId: BIZ,
      stockEnabled: false,
    });

    const log = await logs.findBySaleId(sale.id);
    expect(log).not.toBeNull();
    expect(log!.motivo).toBe('Producto defectuoso');
    expect(log!.cancelledByUserId).toBe(directorId);
    expect(log!.montoOriginalCentavos).toBe(2000n);
  });

  it('rejects with wrong PIN', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ }),
    );

    await expect(
      useCase.execute({
        saleId: sale.id,
        userId: directorId,
        pin: '999999',
        motivo: 'Test',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/PIN incorrecto/);
  });

  it('rejects for non-existent user', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ }),
    );
    const fakeUserId = '01HZ8XQN9GZJXV8AKQ5X0CFAKE' as UserId;

    await expect(
      useCase.execute({
        saleId: sale.id,
        userId: fakeUserId,
        pin: '123456',
        motivo: 'Test',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrado/);
  });

  it('rejects for operativo user without canCancelSales permission', async () => {
    const operativo = await crearUsuario.execute(
      makeNewUser({
        businessId: BIZ,
        nombre: 'Operativo Test',
        pin: '654321',
        role: 'operativo',
      }),
    );
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ }),
    );

    await expect(
      useCase.execute({
        saleId: sale.id,
        userId: operativo.id,
        pin: '654321',
        motivo: 'Test',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/permiso/);
  });

  it('rejects when sale does not exist', async () => {
    const fakeSaleId = '01HZ8XQN9GZJXV8AKQ5X0CSALE' as SaleId;

    await expect(
      useCase.execute({
        saleId: fakeSaleId,
        userId: directorId,
        pin: '123456',
        motivo: 'Test',
        businessId: BIZ,
      }),
    ).rejects.toThrow(/no encontrada/);
  });

  it('rejects when sale is already cancelled', async () => {
    const sale = await sales.create(
      makeNewSale({ businessId: BIZ }),
    );
    // Cancel it first
    await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'First cancel',
      businessId: BIZ,
      stockEnabled: false,
    });

    // Try to cancel again — sale is soft-deleted so findById returns null
    await expect(
      useCase.execute({
        saleId: sale.id,
        userId: directorId,
        pin: '123456',
        motivo: 'Double cancel',
        businessId: BIZ,
        stockEnabled: false,
      }),
    ).rejects.toThrow(/no encontrada/);
  });

  it('does not reverse stock when stockEnabled is false', async () => {
    const product = await products.create(
      makeNewProduct({ businessId: BIZ, seguirStock: true }),
    );
    const sale = await sales.create(
      makeNewSale({
        businessId: BIZ,
        productoId: product.id,
        cantidad: 5,
      }),
    );

    const result = await useCase.execute({
      saleId: sale.id,
      userId: directorId,
      pin: '123456',
      motivo: 'Devolución',
      businessId: BIZ,
      stockEnabled: false,
    });

    expect(result.stockReversed).toBe(false);
    expect(result.cantidadDevuelta).toBeNull();
  });
});

/**
 * What one code does in Inventario's escáner (M-20, ADR-150; board
 * EcInventario): a product Inventario lists opens its movement, one it does
 * not list (stock not tracked, or waiting in Revisión) says so instead of
 * offering an alta that would repeat the code, and the unknown and shared
 * codes stay as Cobrar has them.
 */
import { describe, expect, it } from 'vitest';
import type { ProductId } from '@xangarro/domain';
import { makeProduct } from '../../../../testing/src/fixtures/product';
import { productosDeCaja } from '../../../src/screens/Ventas/cobrar-catalogo';
import {
  elegidoDeDuplicado,
  estadoDeCodigo,
  paraInventario,
} from '../../../src/screens/Ventas/escaner-estado';

const [refresco, servicio, agua, aguaCaja] = productosDeCaja(
  [
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJA' as ProductId, sku: '7509876500017' }),
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJB' as ProductId, sku: '7501234500018' }),
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJC' as ProductId, sku: '012345000065' }),
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJD' as ProductId, sku: '0012345000065' }),
  ],
  new Map(),
);
const catalogo = [refresco!, servicio!, agua!, aguaCaja!];
/** Inventario lists every product but `servicio`. */
const lleva = (p: { id: string }): boolean => p.id !== servicio!.id;

describe('paraInventario', () => {
  it('opens the movement on the one product Inventario lists', () => {
    const e = estadoDeCodigo(catalogo, '7509876500017');
    expect(paraInventario(e, lleva)).toEqual({ tipo: 'abrir', p: refresco });
  });

  it('says the product keeps no stock instead of offering an alta', () => {
    const e = estadoDeCodigo(catalogo, ' 7501234500018 ');
    expect(paraInventario(e, lleva)).toEqual({
      tipo: 'sinExistencias',
      p: servicio,
      codigo: '7501234500018',
    });
  });

  it('keeps the unknown code with its «Darlo de alta»', () => {
    const e = estadoDeCodigo(catalogo, '7509999999999');
    expect(paraInventario(e, lleva)).toEqual({ tipo: 'desconocido', codigo: '7509999999999' });
  });

  it('keeps a shared code waiting for the operator, UPC-A or EAN-13', () => {
    const e = estadoDeCodigo(catalogo, '012345000065');
    expect(paraInventario(e, lleva).tipo).toBe('duplicado');
  });

  it('opens the one chosen from a shared code, or says it keeps no stock', () => {
    const e = estadoDeCodigo(catalogo, '012345000065');
    if (e.tipo !== 'duplicado') throw new Error('expected a duplicate');
    expect(paraInventario(elegidoDeDuplicado(e, aguaCaja!), lleva)).toEqual({
      tipo: 'abrir',
      p: aguaCaja,
    });
    const nadie = (): boolean => false;
    expect(paraInventario(elegidoDeDuplicado(e, agua!), nadie).tipo).toBe('sinExistencias');
  });
});

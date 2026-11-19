/**
 * What one code does in the escáner (M-19, ADR-150; boards MvEscaner and
 * EcDuplicado): one product goes on the ticket, none offers «Darlo de alta»,
 * and two or more ask which one before anything goes on the ticket.
 */
import { describe, expect, it } from 'vitest';
import type { ProductId } from '@xangarro/domain';
import { makeProduct } from '../../../../testing/src/fixtures/product';
import { productosDeCaja } from '../../../src/screens/Ventas/cobrar-catalogo';
import { elegidoDeDuplicado, estadoDeCodigo } from '../../../src/screens/Ventas/escaner-estado';

const [pastor, refresco, refrescoCaja, agua] = productosDeCaja(
  [
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJA' as ProductId, sku: '7501055300075' }),
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJB' as ProductId, sku: '012000001772' }),
    makeProduct({
      id: '01HZ8XQN9GZJXV8AKQ5X0C7BJC' as ProductId,
      sku: '0012000001772',
      estadoRevision: 'pendiente',
    }),
    makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJD' as ProductId, sku: '7501234500018' }),
  ],
  new Map(),
);
const catalogo = [pastor!, refresco!, refrescoCaja!, agua!];

describe('estadoDeCodigo', () => {
  it('puts the one product with that code on the ticket', () => {
    expect(estadoDeCodigo(catalogo, '7501055300075')).toEqual({
      tipo: 'agregado',
      p: pastor,
      avisaDueno: false,
    });
  });

  it('asks which one when two products share the code, UPC-A or EAN-13', () => {
    const e = estadoDeCodigo(catalogo, '0012000001772');
    expect(e.tipo).toBe('duplicado');
    expect(e.tipo === 'duplicado' && e.opciones).toEqual([refresco, refrescoCaja]);
    expect(e.tipo === 'duplicado' && e.codigo).toBe('0012000001772');
  });

  it('offers the alta for a code the catalogue does not have, trimmed', () => {
    expect(estadoDeCodigo(catalogo, ' 7509999999999 ')).toEqual({
      tipo: 'desconocido',
      codigo: '7509999999999',
    });
  });

  it('treats an empty read as unknown, never as a match', () => {
    expect(estadoDeCodigo(catalogo, '   ').tipo).toBe('desconocido');
  });
});

describe('elegidoDeDuplicado', () => {
  it('says the owner will see it when one of the pair is waiting in Revisión', () => {
    const e = estadoDeCodigo(catalogo, '012000001772');
    if (e.tipo !== 'duplicado') throw new Error('expected a duplicate');
    expect(elegidoDeDuplicado(e, refresco!)).toEqual({
      tipo: 'agregado',
      p: refresco,
      avisaDueno: true,
    });
  });

  it('promises nothing when both products are already in the catalogue', () => {
    const otro = productosDeCaja(
      [makeProduct({ id: '01HZ8XQN9GZJXV8AKQ5X0C7BJE' as ProductId, sku: '7501055300075' })],
      new Map(),
    )[0]!;
    const e = estadoDeCodigo([pastor!, otro], '7501055300075');
    if (e.tipo !== 'duplicado') throw new Error('expected a duplicate');
    expect(elegidoDeDuplicado(e, otro).avisaDueno).toBe(false);
  });
});

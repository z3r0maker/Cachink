/**
 * The Cobrar catalogue (Track M, M-07; MvCobrar): real products as tiles,
 * the «Quedan N» chip, the category chips, the search and the barcode.
 */
import { describe, expect, it } from 'vitest';
import type { ProductId } from '@xangarro/domain';
import { makeProduct } from '../../../../testing/src/fixtures/product';
import {
  categoriasDe,
  filtrarCatalogo,
  productosPorCodigo,
  productosDeCaja,
  TODOS,
} from '../../../src/screens/Ventas/cobrar-catalogo';

const pastor = makeProduct({
  id: '01HZ8XQN9GZJXV8AKQ5X0C7BJA' as ProductId,
  nombre: 'Taco de pastor',
  precioVentaCentavos: 25_00n,
  categoria: 'Producto Terminado',
  umbralStockBajo: 10,
  sku: '7501055300075',
});
const agua = makeProduct({
  id: '01HZ8XQN9GZJXV8AKQ5X0C7BJB' as ProductId,
  nombre: 'Agua de horchata',
  precioVentaCentavos: 25_00n,
  categoria: 'Otro',
  umbralStockBajo: 3,
  sku: null,
});

describe('productosDeCaja', () => {
  it('shows «Quedan N» only for a tracked product at or under its threshold', () => {
    const stock = new Map([
      [pastor.id as string, 6],
      [agua.id as string, 22],
    ]);
    const [p, a] = productosDeCaja([pastor, agua], stock);
    expect(p?.quedan).toBe(6);
    expect(a?.quedan).toBeNull();
  });

  it('shows no chip for a product that does not track stock', () => {
    const [p] = productosDeCaja([pastor], new Map());
    expect(p?.quedan).toBeNull();
    expect(p?.codigo).toBe('7501055300075');
  });
});

describe('categoriasDe and filtrarCatalogo', () => {
  const lista = productosDeCaja([pastor, agua], new Map());

  it('offers Todos plus each category present; one category offers none', () => {
    expect(categoriasDe(lista)).toEqual([TODOS, 'Producto Terminado', 'Otro']);
    expect(categoriasDe(lista.slice(0, 1))).toEqual([]);
  });

  it('filters by category and by name, code or price, accents aside', () => {
    expect(filtrarCatalogo(lista, 'Otro', '').map((p) => p.nombre)).toEqual(['Agua de horchata']);
    expect(filtrarCatalogo(lista, TODOS, 'PASTOR').map((p) => p.nombre)).toEqual([
      'Taco de pastor',
    ]);
    expect(filtrarCatalogo(lista, TODOS, '$25.00')).toHaveLength(2);
    expect(filtrarCatalogo(lista, TODOS, '75013')).toHaveLength(0);
  });
});

describe('productosPorCodigo (M-19, ADR-150)', () => {
  const refresco = makeProduct({
    id: '01HZ8XQN9GZJXV8AKQ5X0C7BJC' as ProductId,
    nombre: 'Refresco de cola',
    sku: '0012000001772',
  });
  const refrescoUpc = makeProduct({
    id: '01HZ8XQN9GZJXV8AKQ5X0C7BJD' as ProductId,
    nombre: 'Refresco 600 ml',
    sku: '012000001772',
  });
  const etiqueta = makeProduct({
    id: '01HZ8XQN9GZJXV8AKQ5X0C7BJE' as ProductId,
    nombre: 'Salsa de la casa',
    sku: 'tac-01',
  });
  const lista = productosDeCaja([pastor, agua, refresco, refrescoUpc, etiqueta], new Map());
  const nombres = (codigo: string): readonly string[] =>
    productosPorCodigo(lista, codigo).map((p) => p.nombre);

  it('finds the one product with that barcode, trimmed', () => {
    expect(nombres(' 7501055300075 ')).toEqual(['Taco de pastor']);
  });

  it('returns every product that shares a code, in catalogue order', () => {
    expect(nombres('012000001772')).toEqual(['Refresco de cola', 'Refresco 600 ml']);
  });

  it('matches a UPC-A read as the 13-digit EAN', () => {
    expect(nombres('0012000001772')).toEqual(['Refresco de cola', 'Refresco 600 ml']);
  });

  it('matches a code with letters whatever its case', () => {
    expect(nombres('TAC-01')).toEqual(['Salsa de la casa']);
  });

  it('finds nothing for an unknown or empty code', () => {
    expect(nombres('7501234567897')).toEqual([]);
    expect(nombres('  ')).toEqual([]);
  });
});

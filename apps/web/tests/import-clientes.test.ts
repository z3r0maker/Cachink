import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  parseClientSheet,
  nombreKey,
  telefonoKey,
  type ParsedClientRow,
} from '../src/lib/import-clientes';
import { planImportClientes, type ExistingClient } from '../src/lib/import-plan-clientes';

const HEAD = ['nombre', 'telefono', 'rfc'];

function parse(rows: readonly (readonly unknown[])[]) {
  const r = parseClientSheet([HEAD, ...rows]);
  assert.ok(r.ok);
  return r.rows;
}

describe('parseClientSheet (N-16 acceptance)', () => {
  it('happy path: valid rows become typed values', () => {
    const rows = parse([
      ['Doña Mary', '55 1234 5678', 'xaxx010101000'],
      ['Juan Pérez', '', ''],
    ]);
    assert.deepEqual(rows[0]?.values, {
      nombre: 'Doña Mary',
      telefono: '55 1234 5678',
      rfc: 'XAXX010101000',
    });
    assert.deepEqual(rows[1]?.values, { nombre: 'Juan Pérez', telefono: null, rfc: null });
  });

  it('malformed rows are errors, with every reason on the row', () => {
    const rows = parse([['', 'abc', 'NO-SOY-RFC']]);
    const r = rows[0] as ParsedClientRow;
    assert.equal(r.values, null);
    assert.equal(r.errors.includes('nombre vacío'), true);
    assert.equal(
      r.errors.some((e) => e.includes('no es un teléfono')),
      true,
    );
    assert.equal(
      r.errors.some((e) => e.includes('no es un RFC válido')),
      true,
    );
  });

  it('refuses a file with more than 5,000 rows', () => {
    const big = Array.from({ length: 5_001 }, () => ['Cliente', '', '']);
    const r = parseClientSheet([HEAD, ...big]);
    assert.deepEqual(r, { ok: false, message: 'El archivo tiene 5001 filas; el máximo es 5000.' });
  });

  it('in-file duplicate by telefono is an error on both rows', () => {
    const rows = parse([
      ['Doña Mary', '55 1234 5678', ''],
      ['Otra señora', '5512345678', ''],
    ]);
    assert.equal(rows[0]?.values, null);
    assert.equal(rows[1]?.values, null);
    assert.match((rows[0]?.errors ?? []).join('; '), /filas 2, 3/);
  });

  it('in-file duplicate by nombre (no phone) is an error on both rows', () => {
    const rows = parse([
      ['Doña Mary', '', ''],
      ['doña mary', '', ''],
    ]);
    assert.equal(rows[0]?.values, null);
    assert.equal(rows[1]?.values, null);
  });

  it('a missing nombre column refuses the whole file', () => {
    const r = parseClientSheet([
      ['telefono', 'rfc'],
      ['55', ''],
    ]);
    assert.deepEqual(r, { ok: false, message: 'Faltan columnas: nombre' });
  });

  it('the comparison keys normalise accents, case and spacing — but Ñ is a letter', () => {
    assert.equal(nombreKey('  Dña.  MÁRY '), 'dña. mary');
    assert.equal(nombreKey('Peña'), 'peña');
    assert.notEqual(nombreKey('Peña'), nombreKey('Pena'));
    assert.equal(telefonoKey('55 (1234) 56-78'), '5512345678');
  });
});

const EXISTING: readonly ExistingClient[] = [
  { id: 'C1', nombre: 'Doña Mary', telefono: '55 1234 5678', rfc: null },
  { id: 'C2', nombre: 'Taller El Águila', telefono: null, rfc: null },
];

describe('planImportClientes (owner decision 2026-09-18)', () => {
  it('an unknown row is nuevo', () => {
    const [row] = planImportClientes(parse([['Nuevo Cliente', '', '']]), EXISTING);
    assert.equal(row?.kind, 'nuevo');
  });

  it('matches by telefono digits and updates the RFC', () => {
    const [row] = planImportClientes(
      parse([['Doña Mary', '5512345678', 'XEXX010101000']]),
      EXISTING,
    );
    assert.equal(row?.kind, 'actualizar');
    assert.equal(row?.id, 'C1');
    assert.deepEqual(row?.patch, { telefono: '5512345678', rfc: 'XEXX010101000' });
  });

  it('falls back to the normalised nombre when there is no phone', () => {
    const [row] = planImportClientes(parse([['taller el aguila', '', '']]), EXISTING);
    assert.equal(row?.kind, 'sin-cambios');
    assert.equal(row?.id, 'C2');
  });

  it('an empty optional cell keeps what is stored, never erases it', () => {
    const [row] = planImportClientes(parse([['Doña Mary', '', 'XAXX010101000']]), EXISTING);
    assert.equal(row?.kind, 'actualizar');
    assert.deepEqual(row?.patch, { rfc: 'XAXX010101000' });
  });

  it('a row that carries nothing new is sin-cambios', () => {
    const [row] = planImportClientes(parse([['Doña Mary', '55 1234 5678', '']]), EXISTING);
    assert.equal(row?.kind, 'sin-cambios');
  });

  it('a phone that matches nothing, with a name that does, updates the phone', () => {
    const [row] = planImportClientes(parse([['Doña Mary', '55 9999 9999', '']]), EXISTING);
    assert.equal(row?.kind, 'actualizar');
    assert.deepEqual(row?.patch, { telefono: '55 9999 9999' });
  });
});

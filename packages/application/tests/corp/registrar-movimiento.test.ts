import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { PeriodoCerradoError } from '@xangarro/domain/corp';

import {
  ConceptoRequeridoError,
  ProyectoDesconocidoError,
  RegistrarMovimientoUseCase,
  RevertirMovimientoUseCase,
  YaRevertidoError,
  MovimientoDesconocidoError,
} from '../../src/corp/index.js';
import { FakeLedger } from './fake-ledger.js';

/**
 * E-02 (ADR-124 §4): recording and reversing a movement. The repository is
 * faked in memory; the posting rules themselves are the domain's.
 */

const gasto = {
  fecha: '2026-10-08',
  projectId: 'xangarro',
  concepto: 'Vercel',
  contraparte: 'Vercel Inc.',
  founderId: 'f1',
  source: 'manual' as const,
  sourceRef: null,
  usd: { montoOriginal: 20_00n, tipoCambio: '18.42' },
  deducible: true,
  movement: {
    kind: 'gasto' as const,
    categoria: 'costo_servicio' as const,
    subtotal: 368_40n,
    iva: 0n,
    tratamientoIva: 'exento' as const,
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  },
};

describe('RegistrarMovimientoUseCase', () => {
  it('posts a USD expense with its balanced lines and keeps the original amount', async () => {
    const repo = new FakeLedger();
    const saved = await new RegistrarMovimientoUseCase(repo).execute(gasto);
    assert.equal(saved.moneda, 'USD');
    assert.equal(saved.montoOriginal, 20_00n);
    assert.deepEqual(
      saved.lines.map((l) => [l.cuenta, l.debe, l.haber]),
      [
        ['costo_servicio', 368_40n, 0n],
        ['bancos', 0n, 368_40n],
      ],
    );
  });

  it('refuses a movement dated in a closed month', async () => {
    const repo = new FakeLedger();
    await assert.rejects(
      new RegistrarMovimientoUseCase(repo).execute({ ...gasto, fecha: '2026-08-31' }),
      PeriodoCerradoError,
    );
    assert.equal(repo.entries.length, 0);
  });

  it('refuses an unknown project and an empty concept', async () => {
    const uc = new RegistrarMovimientoUseCase(new FakeLedger());
    await assert.rejects(uc.execute({ ...gasto, projectId: 'otro' }), ProyectoDesconocidoError);
    await assert.rejects(uc.execute({ ...gasto, concepto: '  ' }), ConceptoRequeridoError);
  });

  it('records an import once: the same source reference returns the first entry', async () => {
    const repo = new FakeLedger();
    const uc = new RegistrarMovimientoUseCase(repo);
    const input = { ...gasto, usd: null, source: 'billing' as const, sourceRef: 'in_123' };
    const first = await uc.execute(input);
    const again = await uc.execute(input);
    assert.equal(again.id, first.id);
    assert.equal(repo.entries.length, 1);
  });

  it('allows a shared cost with no project', async () => {
    const saved = await new RegistrarMovimientoUseCase(new FakeLedger()).execute({
      ...gasto,
      usd: null,
      projectId: null,
    });
    assert.equal(saved.projectId, null);
  });
});

describe('RevertirMovimientoUseCase', () => {
  it('posts the mirror entry, pointing at the one it undoes', async () => {
    const repo = new FakeLedger();
    const first = await new RegistrarMovimientoUseCase(repo).execute(gasto);
    const rev = await new RevertirMovimientoUseCase(repo).execute({
      entryId: first.id,
      fecha: '2026-10-09',
      motivo: 'Duplicado',
      founderId: 'f2',
    });
    assert.equal(rev.reversesEntryId, first.id);
    assert.equal(rev.lines[0]?.haber, first.lines[0]?.debe);
  });

  it('refuses to reverse twice, an unknown entry, or into a closed month', async () => {
    const repo = new FakeLedger();
    const first = await new RegistrarMovimientoUseCase(repo).execute(gasto);
    const uc = new RevertirMovimientoUseCase(repo);
    const base = { entryId: first.id, fecha: '2026-10-09', motivo: 'Error', founderId: 'f1' };
    await uc.execute(base);
    await assert.rejects(uc.execute(base), YaRevertidoError);
    await assert.rejects(uc.execute({ ...base, entryId: 'nope' }), MovimientoDesconocidoError);
    repo.closed.add('2026-10');
    const second = await new RegistrarMovimientoUseCase(repo).execute({
      ...gasto,
      fecha: '2026-09-30',
    });
    await assert.rejects(uc.execute({ ...base, entryId: second.id }), PeriodoCerradoError);
  });
});

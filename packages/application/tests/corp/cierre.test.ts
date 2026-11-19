import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import { CierreError, type EventoCierre, type FuentesCierre } from '@xangarro/domain/corp';

import {
  cerrarMes,
  confirmarSaldo,
  pedirReabrir,
  responderReapertura,
  type CierreDeps,
  type CierreRepository,
} from '../../src/corp/index.js';

/** E-14: closing, the two-founder reopening and the bank balance (boards CD-10, CD-10b). */
class FakeCierre implements CierreRepository {
  readonly cerradosSet = new Set<string>(['2026-09']);
  readonly eventosDe = new Map<string, EventoCierre[]>();
  readonly saldos = new Map<string, bigint>();
  meses = new Set(['2026-09', '2026-10', '2026-11']);
  async cerrados() {
    return new Set(this.cerradosSet);
  }
  async eventos(periodo: string) {
    return this.eventosDe.get(periodo) ?? [];
  }
  async conMovimientos() {
    return this.meses;
  }
  #push(periodo: string, kind: EventoCierre['kind'], founderId: string, motivo: string | null) {
    const at = new Date(Date.UTC(2026, 10, 20 + (this.eventosDe.get(periodo)?.length ?? 0)));
    this.eventosDe.set(periodo, [
      ...(this.eventosDe.get(periodo) ?? []),
      { kind, founderId, motivo, at: at.toISOString() },
    ]);
  }
  async cerrar(periodo: string, founderId: string) {
    this.cerradosSet.add(periodo);
    this.#push(periodo, 'cerrado', founderId, null);
  }
  async pedirReabrir(periodo: string, founderId: string, motivo: string) {
    this.#push(periodo, 'reapertura_pedida', founderId, motivo);
  }
  async rechazar(periodo: string, founderId: string) {
    this.#push(periodo, 'reapertura_rechazada', founderId, null);
  }
  async reabrir(periodo: string, founderId: string) {
    this.#push(periodo, 'reabierto', founderId, null);
    this.cerradosSet.delete(periodo);
  }
  async saldoConfirmado(periodo: string) {
    return this.saldos.get(periodo) ?? null;
  }
  async confirmarSaldo(periodo: string, saldo: bigint) {
    this.saldos.set(periodo, saldo);
  }
}

const listo: FuentesCierre = {
  emitidas: { global: 'timbrada', porEmitir: 0 },
  ingresos: { pagos: 38, sinImportar: 0 },
  recibidas: { gastos: 13, sinFactura: 0, porRevisar: 0 },
  banco: { consola: 48_210_55n, confirmado: 48_210_55n },
  impuestos: { obligada: true, presentada: true },
  agenda: { obligaciones: 2, pendientes: 0 },
  estados: { subidos: true },
};

let cierre: FakeCierre;
let fuentes: FuentesCierre;
let deps: CierreDeps;
let hasta: string | null;

beforeEach(() => {
  cierre = new FakeCierre();
  fuentes = listo;
  hasta = null;
  deps = {
    cierre,
    fuentes: async () => fuentes,
    saldoDeBancos: async (d) => {
      hasta = d;
      return 48_210_55n;
    },
  };
});

const octubre = { periodo: '2026-10', mesActual: '2026-11' };

const codigo = async (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof CierreError && e.code === code);

describe('cerrarMes', () => {
  it('locks October with every step done, and records who did', async () => {
    await cerrarMes(deps, { ...octubre, founderId: 'f1' });
    assert.ok(cierre.cerradosSet.has('2026-10'));
    assert.deepEqual(
      cierre.eventosDe.get('2026-10')?.map((e) => [e.kind, e.founderId]),
      [['cerrado', 'f1']],
    );
  });

  it('refuses a step still pending, without locking anything', async () => {
    fuentes = { ...listo, estados: { subidos: false } };
    await codigo(cerrarMes(deps, { ...octubre, founderId: 'f1' }), 'PASOS_PENDIENTES');
    assert.equal(cierre.cerradosSet.has('2026-10'), false);
  });

  it('refuses the month in progress and a month behind an open one', async () => {
    await codigo(
      cerrarMes(deps, { periodo: '2026-11', mesActual: '2026-11', founderId: 'f1' }),
      'MES_EN_CURSO',
    );
    cierre.cerradosSet.delete('2026-09');
    await codigo(cerrarMes(deps, { ...octubre, founderId: 'f1' }), 'MES_ANTERIOR_ABIERTO');
  });

  it('refuses closing twice', async () => {
    await cerrarMes(deps, { ...octubre, founderId: 'f1' });
    await codigo(cerrarMes(deps, { ...octubre, founderId: 'f2' }), 'MES_CERRADO');
  });
});

describe('reopening', () => {
  beforeEach(async () => {
    await cerrarMes(deps, { ...octubre, founderId: 'f1' });
  });

  it('opens October once the other founder approves', async () => {
    await pedirReabrir(deps, {
      periodo: '2026-10',
      founderId: 'f1',
      motivo: ' Falta la comisión ',
    });
    assert.ok(cierre.cerradosSet.has('2026-10'), 'still closed while it waits');
    const pedido = await responderReapertura(deps, {
      periodo: '2026-10',
      founderId: 'f2',
      aprobar: true,
    });
    assert.equal(pedido.motivo, 'Falta la comisión');
    assert.equal(cierre.cerradosSet.has('2026-10'), false);
    assert.deepEqual(
      cierre.eventosDe.get('2026-10')?.map((e) => e.kind),
      ['cerrado', 'reapertura_pedida', 'reabierto'],
    );
  });

  it('keeps it closed when rejected, and a new request can follow', async () => {
    await pedirReabrir(deps, { periodo: '2026-10', founderId: 'f1', motivo: 'x' });
    await responderReapertura(deps, { periodo: '2026-10', founderId: 'f2', aprobar: false });
    assert.ok(cierre.cerradosSet.has('2026-10'));
    await pedirReabrir(deps, { periodo: '2026-10', founderId: 'f2', motivo: 'y' });
  });

  it('refuses the requester approving their own request', async () => {
    await pedirReabrir(deps, { periodo: '2026-10', founderId: 'f1', motivo: 'x' });
    await codigo(
      responderReapertura(deps, { periodo: '2026-10', founderId: 'f1', aprobar: true }),
      'MISMO_SOCIO',
    );
    assert.ok(cierre.cerradosSet.has('2026-10'));
  });

  it('refuses a blank reason, a second request and an answer to none', async () => {
    await codigo(
      pedirReabrir(deps, { periodo: '2026-10', founderId: 'f1', motivo: '' }),
      'MOTIVO_REAPERTURA',
    );
    await codigo(
      responderReapertura(deps, { periodo: '2026-10', founderId: 'f2', aprobar: true }),
      'SIN_REAPERTURA',
    );
    await pedirReabrir(deps, { periodo: '2026-10', founderId: 'f1', motivo: 'x' });
    await codigo(
      pedirReabrir(deps, { periodo: '2026-10', founderId: 'f2', motivo: 'y' }),
      'REAPERTURA_PENDIENTE',
    );
  });

  it('refuses reopening September under a closed October', async () => {
    await codigo(
      pedirReabrir(deps, { periodo: '2026-09', founderId: 'f1', motivo: 'x' }),
      'MES_POSTERIOR_CERRADO',
    );
  });
});

describe('confirmarSaldo', () => {
  it('keeps the statement balance when it equals Bancos at the month’s last day', async () => {
    await confirmarSaldo(deps, { periodo: '2026-10', founderId: 'f1', saldo: 48_210_55n });
    assert.equal(hasta, '2026-10-31');
    assert.equal(cierre.saldos.get('2026-10'), 48_210_55n);
  });

  it('refuses a balance that does not match, and keeps nothing', async () => {
    await codigo(
      confirmarSaldo(deps, { periodo: '2026-10', founderId: 'f1', saldo: 48_193_15n }),
      'SALDO_NO_COINCIDE',
    );
    assert.equal(cierre.saldos.has('2026-10'), false);
  });

  it('refuses a closed month', async () => {
    await codigo(
      confirmarSaldo(deps, { periodo: '2026-09', founderId: 'f1', saldo: 48_210_55n }),
      'MES_CERRADO',
    );
  });
});

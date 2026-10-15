import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { InMemoryEmailSender } from '@xangarro/application/email';
import type { PlantillaRecurrente, RecurrenteDelMes } from '@xangarro/domain/corp';

import { handleAgendaCron, type AgendaCronDeps } from '../src/server/empresa/cron-agenda';
import { cargosDeHoy, correoDe } from '../src/server/empresa/recordatorios';

/** E-02's «Te recordamos registrarlo cada 28»: a recurring charge on its day, in the morning email. */
const vercel: PlantillaRecurrente = {
  id: 'rec-1',
  nombre: 'Vercel',
  contraparte: null,
  categoria: 'costo_servicio',
  moneda: 'USD',
  montoEstimado: 20_00n,
  diaCargo: 28,
  projectId: 'xangarro',
  deducible: true,
  activo: true,
  desde: '2026-09',
};

const del = (fecha: string, estado: RecurrenteDelMes['estado']): RecurrenteDelMes => ({
  plantilla: vercel,
  fecha,
  estado,
  entryId: estado === 'registrado' ? 'E1' : null,
});

describe('cargosDeHoy', () => {
  it('picks a suggested charge whose day is today', () => {
    assert.deepEqual(cargosDeHoy([del('2026-10-28', 'sugerido')], '2026-10-28'), [
      { nombre: 'Vercel', monto: 'USD 20.00' },
    ]);
  });

  it('says nothing for one already registered, one still to come, or a past day', () => {
    assert.deepEqual(cargosDeHoy([del('2026-10-28', 'registrado')], '2026-10-28'), []);
    assert.deepEqual(cargosDeHoy([del('2026-10-28', 'proximo')], '2026-10-27'), []);
    assert.deepEqual(cargosDeHoy([del('2026-10-12', 'sugerido')], '2026-10-28'), []);
  });
});

describe('correoDe with recurring charges', () => {
  it('writes the charge alone, opening Recurrentes', () => {
    const c = correoDe([], 'https://admin.x', [{ nombre: 'Vercel', monto: 'USD 20.00' }]);
    assert.equal(c.subject, 'MEXIA: hoy toca registrar Vercel');
    assert.ok(c.paragraphs.some((p) => p.includes('Vercel (USD 20.00)')));
    assert.equal(c.cta?.href, 'https://admin.x/empresa/movimientos?ver=recurrentes');
  });

  it('counts several charges', () => {
    const c = correoDe([], 'https://admin.x', [
      { nombre: 'Vercel', monto: 'USD 20.00' },
      { nombre: 'Contador', monto: '$3,500.00' },
    ]);
    assert.equal(c.subject, 'MEXIA: hoy toca registrar 2 gastos recurrentes');
  });
});

describe('handleAgendaCron with recurring charges', () => {
  const deps = (
    over: Partial<AgendaCronDeps> = {},
  ): AgendaCronDeps & { sender: InMemoryEmailSender } => ({
    secret: 's3cret',
    hoy: () => '2026-10-28',
    leer: async () => [],
    cargos: async () => [del('2026-10-28', 'sugerido')],
    destinatarios: async () => [{ founderId: 'f1', email: 'uno@mexia.mx' }],
    consoleUrl: 'https://admin.x',
    log: () => {},
    ...over,
    sender: new InMemoryEmailSender(),
  });
  const req = () =>
    new Request('https://admin.x/api/cron/agenda', { headers: { authorization: 'Bearer s3cret' } });

  it('emails a founder on a day with only a recurring charge', async () => {
    const d = deps();
    const res = await handleAgendaCron(req(), d);
    assert.equal(res.status, 200);
    assert.equal(d.sender.sent.length, 1);
    assert.equal(d.sender.sent[0]?.subject, 'MEXIA: hoy toca registrar Vercel');
  });

  it('answers 500 when the templates cannot be read', async () => {
    const d = deps({
      cargos: async () => {
        throw new Error('down');
      },
    });
    assert.equal((await handleAgendaCron(req(), d)).status, 500);
  });
});

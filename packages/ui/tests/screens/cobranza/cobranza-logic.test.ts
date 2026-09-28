/**
 * Fiado y abonos' words on the phone (M-08) over the caja's derivations, and
 * the accounts read from the phone's repositories as the web Worker reads
 * them.
 */
import { describe, expect, it } from 'vitest';
import { abiertas, cuentaPorId, estadoCuenta } from '@xangarro/caja/cobranza';
import type { BusinessId } from '@xangarro/domain';
import {
  digitosTel,
  estadoAbono,
  lineaAbierta,
  montoTecleado,
  telValido,
} from '../../../src/screens/Cobranza/cobranza-logic';
import { leerCuentas, type ReposCuentas } from '../../../src/screens/Cobranza/cuentas-lectura';

const chuy = cuentaPorId('chuy')!;

describe('the abono sheet', () => {
  it('waits for an amount', () => {
    const e = estadoAbono(chuy, '');
    expect(e).toMatchObject({ listo: false, cta: 'Escribe cuánto abona', restante: 860_00n });
    expect(e.aplica).toBe('Elige un monto');
    expect(estadoAbono(chuy, '0').listo).toBe(false);
  });

  it('says where an amount lands, oldest first, and the new balance', () => {
    const e = estadoAbono(chuy, '500');
    expect(e.cta).toBe('Recibir abono de $500.00');
    expect(e.aplica).toBe('V-0288 completa · V-0310 parcial');
    expect(e.restante).toBe(360_00n);
    expect(estadoAbono(chuy, '12.').monto).toBe(12_00n);
  });

  it('takes more than the balance whole: the rest is saldo a favor (D5)', () => {
    const e = estadoAbono(chuy, '900');
    expect(e.listo).toBe(true);
    expect(e.aplica).toContain('$40.00 a su favor');
    expect(e.restante).toBe(0n);
  });

  it('shows what is typed with thousands', () => {
    expect(montoTecleado('')).toBe('0.00');
    expect(montoTecleado('1234.5')).toBe('1,234.5');
  });
});

describe('open sales and the phone number', () => {
  it('says what was already paid on a sale', () => {
    const [vieja, nueva] = abiertas(chuy, estadoCuenta(chuy));
    expect(lineaAbierta(vieja!)).toBe('28 abr · de $800.00, ya abonó $400.00');
    expect(lineaAbierta(nueva!)).toBe('2 may');
  });

  it('wants ten digits after the +52', () => {
    expect(telValido('5533 981 204')).toBe(true);
    expect(telValido('+52 55 3398 1204')).toBe(true);
    expect(digitosTel('+52 55 3398 1204')).toBe('5533981204');
    expect(telValido('5533')).toBe(false);
  });
});

describe('leerCuentas', () => {
  it('assembles each client with the domain saldo', async () => {
    const repos = {
      clients: {
        findByName: async () => [
          {
            id: 'C1',
            nombre: 'Taller de Chuy',
            telefono: null,
            createdAt: '2026-01-10T12:00:00Z',
            limiteCentavos: null,
            plazoDias: null,
          },
        ],
      },
      tickets: {
        findCreditoByClient: async () => [
          {
            id: 'T1',
            folio: 288,
            concepto: 'Comida',
            fecha: '2026-04-28',
            hora: '13:10',
            createdByUserId: 'U1',
          },
          {
            id: 'T2',
            folio: 310,
            concepto: 'Comida',
            fecha: '2026-05-02',
            hora: null,
            createdByUserId: 'U1',
          },
        ],
      },
      sales: {
        findByTicket: async (id: string) =>
          id === 'T1' ? [{ monto: 500_00n }, { monto: 300_00n }] : [{ monto: 460_00n }],
      },
      clientPayments: {
        findByCliente: async () => [
          { id: 'A1', fecha: '2026-05-14', montoCentavos: 400_00n, metodo: 'Efectivo', nota: null },
        ],
      },
      users: { findById: async () => ({ nombre: 'Ana Robledo' }) },
    } as unknown as ReposCuentas;
    const [c] = await leerCuentas(repos, 'B' as BusinessId);
    expect(c?.saldoCentavos).toBe('86000');
    expect(c?.ventas.map((v) => [v.montoCentavos, v.capturo])).toEqual([
      ['80000', 'Ana Robledo · Caja 1'],
      ['46000', 'Ana Robledo · Caja 1'],
    ]);
  });
});

/**
 * Inicio over the phone's rows (M-06): the SQLite rows said through the web
 * caja's `comoInicio`, so the phone and the web agree on every figure.
 */
import { describe, expect, it } from 'vitest';
import { heroFor, kpisFor } from '@xangarro/caja/inicio';
import { cuentaPara } from '@xangarro/caja/lectura';
import type { CajaTurno, RecurringExpense, Sale, Ticket } from '@xangarro/domain';
import {
  cortesDe,
  diasEntre,
  inicioMovil,
  type FilasInicio,
} from '../../../src/screens/Inicio/inicio-filas';
import { rutaMovil } from '../../../src/screens/Inicio/inicio-rutas';
import { partirSaludo } from '../../../src/screens/Inicio/inicio-saludo';
import { haceDias } from '../../../src/screens/Inicio/inicio-lectura';

const AHORA = new Date(2026, 4, 14, 15, 0);
const HOY = '2026-05-14';
const AUDIT = {
  businessId: 'B',
  deviceId: 'D',
  createdByUserId: null,
  updatedAt: '',
  deletedAt: null,
};

function turno(p: Partial<CajaTurno>): CajaTurno {
  return {
    id: 'T1',
    userId: 'U1',
    fecha: HOY,
    aperturaAt: new Date(2026, 4, 14, 8, 15).toISOString(),
    cierreAt: null,
    montoAperturaCentavos: 80_000n,
    efectivoAdicionalCentavos: 0n,
    montoCierreCentavos: null,
    efectivoEsperadoCentavos: null,
    diferenciaCentavos: null,
    discrepancyReason: null,
    explicacion: null,
    totalTransferencias: 0n,
    totalTarjeta: 0n,
    totalQr: 0n,
    totalCredito: 0n,
    egresoAutoId: null,
    conteoCentavos: null,
    conteoAt: null,
    denominaciones: null,
    createdAt: '',
    ...AUDIT,
    ...p,
  } as CajaTurno;
}

function ticket(id: string, metodo: Ticket['metodo'], p: Partial<Ticket> = {}): Ticket {
  return {
    id,
    folio: 1,
    fecha: HOY,
    hora: null,
    concepto: 'Venta',
    metodo,
    clienteId: metodo === 'Crédito' ? 'C1' : null,
    estadoPago: 'pagado',
    efectivoRecibidoCentavos: null,
    cambioCentavos: null,
    cajaTurnoId: 'T1',
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    createdAt: new Date(2026, 4, 14, 14, 54).toISOString(),
    ...AUDIT,
    ...p,
  } as Ticket;
}

const linea = (ticketId: string, monto: bigint): Sale =>
  ({
    id: `L${ticketId}`,
    ticketId,
    fecha: HOY,
    concepto: 'Taco',
    categoria: 'Producto',
    monto,
    productoId: 'P1',
    cantidad: 1,
    createdAt: '',
    ...AUDIT,
  }) as Sale;

const gas: RecurringExpense = {
  id: 'R1',
  concepto: 'Gas de la semana',
  categoria: 'Servicios',
  montoCentavos: 62_000n,
  proveedor: null,
  frecuencia: 'semanal',
  diaDelMes: null,
  diaDeLaSemana: 4,
  proximoDisparo: '2026-05-13',
  activo: true,
  createdAt: '',
  ...AUDIT,
} as unknown as RecurringExpense;

function filas(p: Partial<FilasInicio> = {}): FilasInicio {
  return {
    turno: turno({}),
    tickets: [
      ticket('A', 'Efectivo'),
      ticket('B', 'Crédito'),
      ticket('C', 'Tarjeta', { cancelledAt: new Date(2026, 4, 14, 12, 58).toISOString() }),
    ],
    lineas: [linea('A', 16_000n), linea('B', 9_000n), linea('C', 5_000n)],
    gastos: [],
    abonos: [],
    turnos: [
      turno({
        id: 'T0',
        fecha: '2026-05-13',
        cierreAt: '2026-05-13T23:00:00.000Z',
        diferenciaCentavos: 2_000n,
      }),
      turno({
        id: 'T-1',
        fecha: '2026-05-12',
        cierreAt: '2026-05-12T23:00:00.000Z',
        diferenciaCentavos: 0n,
      }),
    ],
    recurrentes: [gas],
    stock: [{ id: 'P9', nombre: 'Taco de tripa', existencias: 6, umbral: 15 }],
    ...p,
  };
}

const ENTORNO = {
  nombre: 'Ana Robledo',
  negocio: 'Taquería Don Pedro',
  caja: 'Caja 1',
  offline: false,
  pendientes: 0,
  ahora: AHORA,
  dueno: 'Pedro Salas',
};

describe('inicioMovil', () => {
  it('says the open turno with the web caja figures', () => {
    const d = inicioMovil(filas(), ENTORNO, HOY);
    expect(d.situacion).toBe('vendiendo');
    expect(d.nombre).toBe('Ana');
    expect(d.dueno).toBe('Pedro');
    expect(d.turno?.desde).toBe('08:15');
    expect(d.turno?.ventas).toBe(2);
    expect(d.turno?.canceladas).toBe(1);
    expect(d.turno?.cobrado).toBe(25_000n);
    expect(d.turno?.fiado).toBe(9_000n);
    expect(d.turno?.clientesFiados).toBe(1);
    expect(d.turno?.esperado).toBe(96_000n);
    expect(heroFor(d).tono).toBe('listo');
    expect(kpisFor(d).map((k) => k.value)).toEqual(['2', '$250.00', '$960.00', '$90.00']);
  });

  it('lists the due gasto first, then the low stock, with the web hrefs', () => {
    const d = inicioMovil(filas(), ENTORNO, HOY);
    expect(d.tareas.map((t) => t.tipo)).toEqual(['gasto', 'reponer']);
    expect(d.tareas[0]?.titulo).toBe('Registrar gas de la semana');
    expect(d.tareas[1]?.detalle).toBe('Quedan 6 · el umbral es 15');
    expect(d.tareas.map((t) => rutaMovil(t.href ?? ''))).toEqual([
      '/egresos',
      '/inventario?reponer=P9',
    ]);
  });

  it('reads fiado from the accounts: «Por cobrar» and «Cobrar a …» when overdue', () => {
    const chuy = cuentaPara({
      cliente: {
        id: 'C1',
        nombre: 'Taller de Chuy',
        telefono: null,
        createdAt: '2026-01-10T12:00:00Z',
        limiteCentavos: 1500_00n,
        plazoDias: 15,
      },
      ventas: [
        {
          id: 'T9',
          folio: 288,
          concepto: 'Comida',
          fecha: '2026-04-28',
          hora: '13:10',
          createdByUserId: null,
        },
      ],
      montos: new Map([['T9', 800_00n]]),
      abonos: [{ id: 'A1', fecha: HOY, montoCentavos: 400_00n, metodo: 'Efectivo', nota: null }],
      capturos: new Map(),
    });
    const cerrado = turno({ cierreAt: new Date(2026, 4, 14, 14, 0).toISOString() });
    const d = inicioMovil(filas({ turno: cerrado }), ENTORNO, HOY, [chuy]);
    expect(d.ultimoTurno.porCobrar).toBe(400_00n);
    expect(d.ultimoTurno.clientesConSaldo).toBe(1);
    const cobrar = d.tareas.find((t) => t.tipo === 'cobrar');
    expect(cobrar?.titulo).toBe('Cobrar a Taller de Chuy');
    expect(rutaMovil(cobrar?.href ?? '')).toBe('/cobranza/C1?abonar=1');
    expect(inicioMovil(filas(), ENTORNO, HOY).ultimoTurno.porCobrar).toBe(0n);
  });

  it('lists the closes newest first, as the chips say them', () => {
    const d = inicioMovil(filas(), ENTORNO, HOY);
    expect(d.cortes.map((c) => c.etiqueta)).toEqual(['Ayer · Caja 1', '12 may · Caja 1']);
    expect(d.cortes[0]?.resultado).toEqual({ tipo: 'sobro', monto: 2_000n });
  });

  it('with no turno open the caja waits: turno cerrado, the last fondo', () => {
    const cerrado = turno({
      fecha: '2026-05-13',
      cierreAt: '2026-05-13T23:00:00.000Z',
      diferenciaCentavos: 0n,
    });
    const d = inicioMovil(filas({ turno: cerrado, tickets: [], lineas: [] }), ENTORNO, HOY);
    expect(d.situacion).toBe('turno-cerrado');
    expect(heroFor(d).cta).toBe('Abrir turno');
    expect(heroFor(d).nota).toEqual(['Ayer cerraste con ', { b: '$800.00' }, ' de fondo']);
  });

  it('a first day on the device has no turno at all and still reads', () => {
    const d = inicioMovil(
      filas({ turno: null, tickets: [], lineas: [], turnos: [] }),
      ENTORNO,
      HOY,
    );
    expect(d.situacion).toBe('turno-cerrado');
    expect(d.cortes).toEqual([]);
  });

  it('twelve hours open asks to close; offline says what waits', () => {
    const largo = turno({ aperturaAt: new Date(2026, 4, 14, 2, 0).toISOString() });
    expect(inicioMovil(filas({ turno: largo }), ENTORNO, HOY).situacion).toBe('hora-de-cerrar');
    const off = inicioMovil(filas(), { ...ENTORNO, offline: true, pendientes: 3 }, HOY);
    expect(heroFor(off).tono).toBe('offline');
    expect(heroFor(off).title).toContain('3 registros esperan');
  });
});

describe('helpers', () => {
  it('keeps only counted closes, four at most', () => {
    const abiertos = [turno({ id: 'X' })];
    expect(cortesDe(abiertos)).toEqual([]);
  });
  it('counts days between dates', () => {
    expect(diasEntre('2026-05-14', '2026-05-13')).toBe(-1);
    expect(diasEntre('2026-02-27', '2026-03-01')).toBe(2);
    expect(haceDias('2026-03-01', 30)).toBe('2026-01-30');
  });
  it('maps the web hrefs to the phone routes, or none', () => {
    expect(rutaMovil('/operador/gastos?recurrente=R1')).toBe('/egresos');
    expect(rutaMovil('/operador/caja')).toBe('/cobrar');
    expect(rutaMovil('/operador/cierre')).toBe('/cierre');
    expect(rutaMovil('/operador/cobranza/C1')).toBe('/cobranza/C1?abonar=1');
    expect(rutaMovil('/operador/cobranza')).toBe('/cobranza');
    expect(rutaMovil('/operador/avisos')).toBe('/avisos');
    expect(rutaMovil('/operador/pendientes')).toBe('/pendientes');
    expect(rutaMovil('/operador/inventario?reponer=P9')).toBe('/inventario?reponer=P9');
    expect(rutaMovil('/operador/acceso')).toBeNull();
  });
  it('splits the greeting from «La caja está lista.»', () => {
    expect(partirSaludo('¡Buenas tardes, Ana! La caja está lista.')).toEqual([
      '¡Buenas tardes, Ana!',
      'La caja está lista.',
    ]);
    expect(partirSaludo('¡Buen día, Ana!')).toEqual(['¡Buen día, Ana!', null]);
  });
});

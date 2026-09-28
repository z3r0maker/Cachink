/**
 * The phone's reads behind Inventario and Avisos (M-09), over stub
 * repositories: tracked products only, this turno's own manual movements,
 * the owner's messages with their corte and reply, device-local read marks,
 * and the lowest stock for «De tu caja».
 */
import { describe, expect, it } from 'vitest';
import { InMemoryAppConfigRepository } from '@xangarro/testing';
import { leerInventario } from '../../../src/screens/Inventario/inventario-lectura';
import { leerAvisos, leidos, marcarLeidos } from '../../../src/screens/Avisos/avisos-lectura';

const BIZ = 'B1' as never;
const USER = 'U1' as never;
const DEVICE = 'D1';

function producto(id: string, nombre: string, over: Record<string, unknown> = {}) {
  return {
    id,
    nombre,
    seguirStock: true,
    deletedAt: null,
    estadoRevision: 'aprobado',
    umbralStockBajo: 10,
    unidad: 'kg',
    icono: 'beef',
    colorFondo: 'pink',
    categoria: 'Carnes',
    costoUnitCentavos: 50_00n,
    ...over,
  };
}

const PRODUCTOS = [
  producto('P2', 'Suadero'),
  producto('P1', 'Carne de pastor'),
  producto('P3', 'Servilletas', { seguirStock: false }),
  producto('P4', 'Orden nueva', { estadoRevision: 'pendiente' }),
];
const STOCK: Record<string, number> = { P1: 4, P2: 30, P3: 0, P4: 0 };

function mov(id: string, over: Record<string, unknown>) {
  return {
    id,
    productoId: 'P1',
    tipo: 'entrada',
    cantidad: 5,
    motivo: 'Compra a proveedor',
    nota: 'La Central',
    origen: 'manual',
    deviceId: DEVICE,
    createdAt: '2026-09-28T15:00:00.000Z',
    deletedAt: null,
    ...over,
  };
}

const MOVS = [
  mov('M1', {}),
  mov('M2', {
    tipo: 'salida',
    motivo: 'Merma / daño',
    nota: 'Se rompió',
    createdAt: '2026-09-28T16:00:00.000Z',
  }),
  mov('M3', { tipo: 'salida', motivo: 'Venta', origen: 'venta' }),
  mov('M4', { deviceId: 'OTRO' }),
  mov('M5', { createdAt: '2026-09-28T08:00:00.000Z' }),
];

function repos(turnoAbierto = true) {
  return {
    products: { listForBusiness: async () => PRODUCTOS },
    inventoryMovements: {
      sumStock: async (id: string) => STOCK[id] ?? 0,
      findByDateRange: async () => MOVS,
    },
    cajaTurnos: {
      findOpenByUser: async () =>
        turnoAbierto
          ? { id: 'T1', fecha: '2026-09-28', aperturaAt: '2026-09-28T14:00:00.000Z' }
          : null,
      findById: async () => ({ id: 'T0', fecha: '2026-05-13' }),
    },
    appConfig: new InMemoryAppConfigRepository(),
    mensajesOperador: {
      findByOperador: async () => [
        {
          id: 'MSG1',
          severidad: 'aclaracion',
          cuerpo: 'Faltaron $60.00.',
          createdAt: '2026-09-28T15:12:00.000Z',
          cajaTurnoId: 'T0',
          deletedAt: null,
        },
        {
          id: 'MSG2',
          severidad: 'info',
          cuerpo: 'Hola.',
          createdAt: '2026-09-28T15:00:00.000Z',
          cajaTurnoId: null,
          deletedAt: '2026-09-28T15:30:00.000Z',
        },
      ],
    },
    respuestasOperador: {
      findByMensaje: async () => [{ texto: 'Di cambio de más.' }],
    },
  } as never;
}

describe('leerInventario', () => {
  it('reads tracked, approved products by name, with the phone’s glyph and tint', async () => {
    const r = await leerInventario(repos(), {
      businessId: BIZ,
      userId: USER,
      deviceId: DEVICE,
      hoy: '2026-09-28',
    });
    expect(r.existencias.map((e) => e.nombre)).toEqual(['Carne de pastor', 'Suadero']);
    expect(r.existencias[0]).toMatchObject({
      existencias: 4,
      umbral: 10,
      unidad: 'kg',
      glifo: 'beef',
      costoUnitCentavos: 50_00n,
    });
  });

  it('keeps only this device’s manual entradas and mermas since the apertura', async () => {
    const r = await leerInventario(repos(), {
      businessId: BIZ,
      userId: USER,
      deviceId: DEVICE,
      hoy: '2026-09-28',
    });
    expect(r.movimientos.map((m) => [m.id, m.tipo, m.detalle])).toEqual([
      ['M1', 'Entrada', 'La Central'],
      ['M2', 'Merma', 'Se rompió'],
    ]);
  });

  it('has no movements without an open turno', async () => {
    const r = await leerInventario(repos(false), {
      businessId: BIZ,
      userId: USER,
      deviceId: DEVICE,
      hoy: '2026-09-28',
    });
    expect(r.movimientos).toEqual([]);
  });
});

describe('leerAvisos', () => {
  it('reads the live messages with their corte and reply, and the lowest stock', async () => {
    const a = await leerAvisos(
      repos(),
      { businessId: BIZ, userId: USER },
      { cuantos: 2, desde: null, rechazados: 1 },
    );
    expect(a.mensajes).toEqual([
      {
        id: 'MSG1',
        severidad: 'aclaracion',
        cuerpo: 'Faltaron $60.00.',
        creado: '2026-09-28T15:12:00.000Z',
        corte: '2026-05-13',
        respuesta: 'Di cambio de más.',
      },
    ]);
    expect(a.stockBajo).toEqual([
      { id: 'P1', nombre: 'Carne de pastor', existencias: 4, umbral: 10 },
    ]);
    expect(a.cola).toEqual({ cuantos: 2, desde: null });
    expect(a.rechazados).toBe(1);
  });

  it('keeps the read marks on the device, once each', async () => {
    const r = repos();
    await marcarLeidos(r, ['MSG1']);
    await marcarLeidos(r, ['MSG1', 'stock:P1:4']);
    expect(await leidos(r)).toEqual(['MSG1', 'stock:P1:4']);
  });
});

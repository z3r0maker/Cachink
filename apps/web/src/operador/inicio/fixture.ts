import type { InicioData } from './types';

/**
 * The design's example day (`Operador Inicio.dc.html`), in centavos. The figures
 * agree with Turno, Ventas and Cierre: 12 sales, $3,280.00 collected, $2,870.00
 * expected cash, $182.00 on credit. Replaced by live data in O-06.
 */
export const INICIO_FIXTURE: InicioData = {
  nombre: 'Ana',
  fecha: 'Jueves 14 de mayo · Taquería Don Pedro, Caja 1',
  dueno: 'Pedro',
  situacion: 'vendiendo',
  offline: false,
  pendientes: 3,
  turno: {
    ventas: 12,
    canceladas: 1,
    ultimaCancelada: '12:58',
    cobrado: 328_000n,
    esperado: 287_000n,
    fiado: 18_200n,
    clientesFiados: 2,
    ultimaVentaHace: '6 minutos',
    horasAbierto: 12,
  },
  ultimoTurno: {
    cobrado: 312_000n,
    cuando: 'Ayer',
    ventas: 14,
    resultado: { tipo: 'cuadro' },
    fondoSugerido: 80_000n,
    porCobrar: 178_000n,
    clientesConSaldo: 3,
  },
  corteAclarar: { dia: '13', caja: 'Caja 2', monto: 6_000n },
  tareas: [
    {
      id: 'gas',
      tipo: 'gasto',
      titulo: 'Registrar el gas de la semana',
      detalle: 'Se repite cada semana · la última vez fueron $620.00',
    },
    {
      id: 'tripa',
      tipo: 'reponer',
      titulo: 'Reponer taco de tripa',
      detalle: 'Quedan 6 · el umbral es 15',
    },
    {
      id: 'chuy',
      tipo: 'cobrar',
      titulo: 'Cobrar al Taller de Chuy',
      detalle: 'Debe $860.00 · la venta más antigua es del 28 abr',
    },
    {
      id: 'agua',
      tipo: 'entrada',
      titulo: 'Llegó el agua embotellada',
      detalle: 'Registra la entrada para que el stock cuadre',
    },
  ],
  mensajes: [
    {
      id: 'corte-13',
      severidad: 'alta',
      titulo: 'Aclara el corte del 13 de mayo',
      cuerpo: 'Faltaron $60.00 en la Caja 2. Escríbeme qué pasó, no hay problema.',
      hora: 'Hoy 09:12',
    },
    {
      id: 'gringa',
      severidad: 'normal',
      titulo: 'Sube el precio de la gringa a $65',
      cuerpo: 'Desde mañana. Ya lo cambié en el catálogo.',
      hora: 'Ayer 19:40',
    },
  ],
  cortes: [
    { etiqueta: 'Ayer · Caja 1', resultado: { tipo: 'cuadro' } },
    { etiqueta: '12 may · Caja 1', resultado: { tipo: 'cuadro' } },
    { etiqueta: '11 may · Caja 1', resultado: { tipo: 'sobro', monto: 2_000n } },
    { etiqueta: '10 may · Caja 1', resultado: { tipo: 'cuadro' } },
  ],
};

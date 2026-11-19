import type { Servicio } from '../../src/corp/servicios/index.js';

/** E-24's fixed service, board CD-18: Vercel, USD 20 on the 28th, by card. */
export const fijo: Servicio = {
  id: 'srv-vercel',
  nombre: 'Vercel',
  para: 'Portal y landing',
  categoria: 'costo_servicio',
  cobro: 'fijo',
  estado: 'activo',
  moneda: 'USD',
  monto: 20_00n,
  diaCargo: 28,
  renueva: null,
  tarifa: null,
  aviso: null,
  limite: null,
  usoPlan: null,
  unidad: null,
  gastoMes: null,
  gastoAl: null,
  pagaCon: 'Tarjeta •••• 4821',
  plantillaId: 'rec-vercel',
};

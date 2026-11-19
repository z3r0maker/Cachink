import type { CargoDeServicio } from '@xangarro/data-corp';
import type { Servicio } from '@xangarro/domain/corp';

import type { DatosServicios } from '../src/server/empresa/servicios-textos';

/**
 * Board CD-18's 8 October 2026: Azure AI Foundry by use, Vercel fixed in
 * dollars, Supabase free at 62 %, Facturapi to contract, Apple's renewal
 * within the month, Stripe's commission, and a dropped one.
 */
const base: Servicio = {
  id: '',
  nombre: '',
  para: null,
  categoria: 'costo_servicio',
  cobro: 'fijo',
  estado: 'activo',
  moneda: 'MXN',
  monto: null,
  diaCargo: null,
  renueva: null,
  tarifa: null,
  aviso: null,
  limite: null,
  usoPlan: null,
  unidad: null,
  gastoMes: null,
  gastoAl: null,
  pagaCon: 'Tarjeta •••• 4821',
  plantillaId: null,
};

export const AZURE: Servicio = {
  ...base,
  id: 'srv-azure',
  nombre: 'Azure AI Foundry',
  para: 'Claude para los agentes',
  cobro: 'uso',
  diaCargo: 3,
  aviso: 2_500_00n,
  gastoMes: 441_29n,
  gastoAl: '2026-10-08',
  plantillaId: 'rec-azure',
};

export const VERCEL: Servicio = {
  ...base,
  id: 'srv-vercel',
  nombre: 'Vercel',
  para: 'Portal y landing',
  moneda: 'USD',
  monto: 20_00n,
  diaCargo: 28,
  plantillaId: 'rec-vercel',
};

export const SUPABASE: Servicio = {
  ...base,
  id: 'srv-supabase',
  nombre: 'Supabase',
  cobro: 'gratis',
  limite: 500,
  usoPlan: 310,
  unidad: 'MB',
  pagaCon: null,
};

export const FACTURAPI: Servicio = {
  ...base,
  id: 'srv-facturapi',
  nombre: 'Facturapi',
  estado: 'por_contratar',
  monto: 650_00n,
  diaCargo: 1,
  pagaCon: null,
};

export const APPLE: Servicio = {
  ...base,
  id: 'srv-apple',
  nombre: 'Apple Developer',
  categoria: 'desarrollo',
  cobro: 'anual',
  moneda: 'USD',
  monto: 99_00n,
  renueva: '2026-11-01',
  plantillaId: 'rec-apple',
};

export const STRIPE: Servicio = {
  ...base,
  id: 'srv-stripe',
  nombre: 'Stripe',
  cobro: 'comision',
  tarifa: '3.6 % + $3 por pago',
  pagaCon: null,
};

export const VIEJO: Servicio = { ...VERCEL, id: 'srv-viejo', nombre: 'Heroku', estado: 'baja' };

const cargo = (
  plantillaId: string,
  mes: string,
  fecha: string,
  monto: bigint,
): CargoDeServicio => ({
  plantillaId,
  mes,
  entryId: `e-${plantillaId}-${mes}`,
  fecha,
  concepto: plantillaId === 'rec-azure' ? 'Azure AI Foundry' : 'Vercel',
  monto,
});

export const DATOS: DatosServicios = {
  servicios: [AZURE, VERCEL, SUPABASE, FACTURAPI, APPLE, STRIPE, VIEJO],
  cargos: [
    cargo('rec-azure', '2026-06', '2026-07-03', 120_00n),
    cargo('rec-azure', '2026-07', '2026-08-03', 480_00n),
    cargo('rec-azure', '2026-08', '2026-09-03', 900_00n),
    cargo('rec-azure', '2026-09', '2026-10-03', 1_240_00n),
    cargo('rec-vercel', '2026-08', '2026-08-28', 368_00n),
    cargo('rec-vercel', '2026-09', '2026-09-28', 368_00n),
  ],
  comisiones: new Map([
    ['2026-08', 1_300_00n],
    ['2026-09', 1_450_00n],
    ['2026-10', 400_00n],
  ]),
  hoy: '2026-10-08',
};

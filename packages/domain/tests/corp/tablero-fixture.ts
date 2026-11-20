import type { EventoTarjeta, Objetivo, Tarjeta } from '../../src/corp/tablero/index.js';

/** Builders for the Tablero tests (E-20): a 4T 2026 card worth $35,000 by average. */
export const tarjeta = (over: Partial<Tarjeta> = {}): Tarjeta => ({
  id: 't1',
  trimestre: '2026-T4',
  tipo: 'entregable',
  titulo: 'Lanzamiento público',
  criterio: 'En App Store y en la web, con cobro activo.',
  responsable: 1,
  vence: '2026-11-30',
  objetivoId: null,
  valores: { 1: 40_000_00n, 2: 30_000_00n },
  cotizacion: null,
  cotizacionDocId: null,
  descartadaEn: null,
  eventos: [],
  ...over,
});

export const ev = (
  tipo: EventoTarjeta['tipo'],
  fecha: string,
  socio: EventoTarjeta['socio'],
  over: Partial<EventoTarjeta> = {},
): EventoTarjeta => ({
  tipo,
  socio,
  fecha,
  enlace: tipo === 'terminada' ? 'https://ayuda.xangarro.mx' : null,
  documentoId: null,
  motivo: tipo === 'objetada' || tipo === 'al_mediador' ? 'Falta el video de inventario.' : null,
  aceptada: null,
  ...over,
});

export const objetivo = (over: Partial<Objetivo> = {}): Objetivo => ({
  id: 'o1',
  trimestre: '2026-T4',
  quien: 2,
  titulo: '60 negocios pagando',
  meta: 60,
  unidad: 'negocios',
  avances: [],
  ...over,
});

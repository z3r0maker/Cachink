import type { ConteoDenominaciones } from '@xangarro/domain';

import { TURNO_FIXTURE } from '../turno/fixture';
import type { CierreData } from './types';

/**
 * The design's close (`Operador Cierre de turno.dc.html`), in centavos:
 * $800 + $1,980 + $550 − $620 = $2,710 expected, twelve ventas, $3,120
 * cobrado, one $60 cancellation, $182 fiado, 3 entradas · 2 mermas.
 */
export const CIERRE_FIXTURE: CierreData = {
  operador: 'Ana Robledo',
  caja: 'Caja 1',
  desde: '08:15',
  hasta: '21:04',
  dueno: 'Pedro',
  negocio: 'Taquería Don Pedro',
  partes: {
    fondo: TURNO_FIXTURE.fondo,
    ventasEfectivo: TURNO_FIXTURE.ventasEfectivo,
    abonosEfectivo: TURNO_FIXTURE.abonosEfectivo,
    gastosEfectivo: TURNO_FIXTURE.gastosEfectivo,
  },
  resumen: {
    ventas: 12,
    cobrado: 312_000n,
    canceladas: 1,
    cancelado: 6_000n,
    fiado: 18_200n,
    entradas: 3,
    mermas: 2,
  },
  conteo: {},
};

/** Counts that land exactly on the $2,710 the board expects. */
export const CONTEO_CUADRA: ConteoDenominaciones = {
  'billete-1000': 2,
  'billete-500': 1,
  'billete-100': 2,
  'moneda-10': 1,
};

/** $70 short of the board's esperado. */
export const CONTEO_FALTA: ConteoDenominaciones = {
  'billete-1000': 2,
  'billete-500': 1,
  'billete-100': 1,
  'billete-20': 2,
};

/** $910 over the board's esperado. */
export const CONTEO_SOBRA: ConteoDenominaciones = {
  'billete-1000': 3,
  'billete-500': 1,
  'billete-100': 1,
  'billete-20': 1,
};

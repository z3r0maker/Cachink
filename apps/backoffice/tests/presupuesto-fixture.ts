import type {
  ImporteResultados,
  PlantillaRecurrente,
  Presupuesto,
  RecurrenteDelMes,
  SolicitudGasto,
} from '@xangarro/domain/corp';

import type { DatosPresupuesto } from '../src/server/empresa/presupuesto-view';

/**
 * Board CD-15d's company on 19 November 2026: $46,800.00 of income in
 * August to October (a $1,560.00 Límite), November's expenses so far, the
 * recurring charges still to come this month and next, the 4T budget of
 * $31,000.00 a month approved by both, and November's three requests.
 */
const linea = (
  n: number,
  cuenta: ImporteResultados['cuenta'],
  importe: bigint,
  fecha: string,
): ImporteResultados => ({
  entryId: `e${n}`,
  concepto: `x${n}`,
  cuenta,
  importe,
  fecha,
  fechaFlujo: fecha,
});

export const IMPORTES: readonly ImporteResultados[] = [
  linea(1, 'ingresos', 14_000_00n, '2026-08-10'),
  linea(2, 'ingresos', 15_600_00n, '2026-09-10'),
  linea(3, 'ingresos', 17_200_00n, '2026-10-10'),
  linea(4, 'administracion', 15_000_00n, '2026-07-20'),
  linea(5, 'ventas_marketing', 30_000_00n, '2026-08-20'),
  linea(6, 'costo_servicio', 12_000_00n, '2026-09-20'),
  linea(7, 'desarrollo', 12_000_00n, '2026-10-20'),
  linea(8, 'costo_servicio', 6_010_00n, '2026-11-03'),
  linea(9, 'ventas_marketing', 9_600_00n, '2026-11-10'),
  linea(10, 'desarrollo', 1_870_00n, '2026-11-11'),
  linea(11, 'administracion', 760_00n, '2026-11-12'),
  linea(12, 'financiero', 120_00n, '2026-11-05'),
];

const plantilla = (
  id: string,
  categoria: PlantillaRecurrente['categoria'],
  montoEstimado: bigint,
): PlantillaRecurrente => ({
  id,
  nombre: id,
  contraparte: null,
  rfc: null,
  categoria,
  moneda: 'MXN',
  montoEstimado,
  diaCargo: 25,
  projectId: 'xangarro',
  deducible: true,
  activo: true,
  desde: '2026-01',
});

const proximo = (p: PlantillaRecurrente, mes: string): RecurrenteDelMes => ({
  plantilla: p,
  fecha: `${mes}-25`,
  estado: 'proximo',
  entryId: null,
  facturaDel: null,
});

const PLANTILLAS = [
  plantilla('hosting', 'costo_servicio', 2_490_00n),
  plantilla('anuncios', 'ventas_marketing', 3_450_00n),
  plantilla('herramientas', 'desarrollo', 3_130_00n),
  plantilla('contador', 'administracion', 4_740_00n),
];

const at = (dia: string) => `${dia}T18:00:00.000Z`;

export const APROBADO: Presupuesto = {
  id: 'p4t',
  trimestre: '2026-T4',
  montos: {
    costo_servicio: 8_500_00n,
    ventas_marketing: 12_000_00n,
    desarrollo: 5_000_00n,
    administracion: 5_500_00n,
  },
  preparadoPor: 'f1',
  preparadoAt: at('2026-10-01'),
  respuesta: { kind: 'aprobado', founderId: 'f2', at: at('2026-10-02') },
};

export const PENDIENTE_1T: Presupuesto = {
  id: 'p1t',
  trimestre: '2027-T1',
  montos: {
    costo_servicio: 9_000_00n,
    ventas_marketing: 13_000_00n,
    desarrollo: 5_500_00n,
    administracion: 5_500_00n,
  },
  preparadoPor: 'f1',
  preparadoAt: at('2026-11-18'),
  respuesta: null,
};

const solicitud = (over: Partial<SolicitudGasto> & Pick<SolicitudGasto, 'id'>): SolicitudGasto => ({
  periodo: '2026-11',
  founderId: 'f2',
  concepto: 'x',
  categoria: 'ventas_marketing',
  monto: 0n,
  automatica: false,
  at: at('2026-11-17'),
  respuesta: null,
  ...over,
});

export const SOLICITUDES: readonly SolicitudGasto[] = [
  solicitud({
    id: 'dominio',
    concepto: 'Dominio xangarro.com.mx por 5 años',
    categoria: 'administracion',
    monto: 4_000_00n,
    at: at('2026-11-04'),
    respuesta: { kind: 'aprobada', monto: 4_000_00n, founderId: 'f1', at: at('2026-11-05') },
  }),
  solicitud({
    id: 'canva',
    founderId: 'f1',
    concepto: 'Canva',
    monto: 279_00n,
    automatica: true,
    at: at('2026-11-12'),
  }),
  solicitud({ id: 'video', concepto: 'Campaña de video para Instagram', monto: 6_000_00n }),
];

export const datos = (over: Partial<DatosPresupuesto> = {}): DatosPresupuesto => ({
  hoy: '2026-11-19',
  importes: IMPORTES,
  recurrentes: new Map([
    ['2026-11', PLANTILLAS.map((p) => proximo(p, '2026-11'))],
    ['2026-12', PLANTILLAS.map((p) => proximo(p, '2026-12'))],
  ]),
  deRecurrentes: new Set(),
  presupuestos: [APROBADO],
  solicitudes: SOLICITUDES,
  socios: new Map([
    ['f1', 'Fundador 1'],
    ['f2', 'Fundador 2'],
  ]),
  ...over,
});

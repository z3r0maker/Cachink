import type { LlamadaConEstado, MovimientoCajaDeEntrada } from '@xangarro/data-corp';
import type { CuentaSocio, MovementKind, PlantillaRecurrente } from '@xangarro/domain/corp';

import type { DatosCaja } from '../src/server/empresa/caja-view';
import { mesDe, type MesImpuestos } from '../src/server/empresa/impuestos-view';
import { datos as datosImpuestos } from './impuestos-fixture';

/**
 * Board CD-15c's company seen on 10 November 2026: capital in August, the
 * first cobro and a funding call in September, October's month (a refund, a
 * tax payment, a bank fee), and a supplier paid in November. Fundador 1 lent
 * $10,000.00; a funding call waits on Fundador 2.
 */
const mov = (
  n: number,
  fecha: string,
  importe: bigint,
  kind: MovementKind,
  socios = false,
): MovimientoCajaDeEntrada => ({ entryId: `e${n}`, fecha, importe, kind, socios });

export const MOVS: readonly MovimientoCajaDeEntrada[] = [
  mov(1, '2026-08-03', 60_000_00n, 'aportacion_capital', true),
  mov(2, '2026-09-05', 22_000_00n, 'cobro'),
  mov(3, '2026-09-10', -24_000_00n, 'gasto'),
  mov(4, '2026-09-20', 80_000_00n, 'fondeo_mitades', true),
  mov(5, '2026-10-05', 21_980_00n, 'cobro'),
  mov(6, '2026-10-08', -350_00n, 'cobro'),
  mov(7, '2026-10-12', -24_118_00n, 'gasto'),
  mov(8, '2026-10-17', -1_135_33n, 'pago_impuestos'),
  mov(9, '2026-10-31', -17_40n, 'comision_bancaria'),
  mov(10, '2026-11-03', -3_500_00n, 'pago_proveedor'),
];

const cuenta = (prestamo: bigint): CuentaSocio => ({
  capital: 0n,
  fondeo: 0n,
  adicional: 0n,
  prestamo,
  reembolsado: 0n,
});

export const LLAMADA: LlamadaConEstado = {
  id: 'call-nov',
  concepto: 'Fondeo de noviembre',
  total: 40_000_00n,
  porSocio: 20_000_00n,
  vence: '2026-11-30',
  createdBy: 'f1',
  mitades: { 1: { entryId: 'e-f1', fecha: '2026-11-12' }, 2: null },
};

export const VERCEL: PlantillaRecurrente = {
  id: 'rec-vercel',
  nombre: 'Vercel',
  contraparte: 'Vercel Inc.',
  rfc: null,
  categoria: 'costo_servicio',
  moneda: 'USD',
  montoEstimado: 20_00n,
  diaCargo: 28,
  projectId: 'xangarro',
  deducible: true,
  activo: true,
  desde: '2026-09',
};

export const CONTADOR: PlantillaRecurrente = {
  ...VERCEL,
  id: 'rec-contador',
  nombre: 'Contador',
  moneda: 'MXN',
  montoEstimado: 3_500_00n,
  diaCargo: 1,
};

const octubre: MesImpuestos = (() => {
  const m = mesDe(datosImpuestos(), '2026-10');
  if (m === null) throw new Error('no October in the Impuestos fixture');
  return m;
})();

export function caja(o: Partial<DatosCaja> = {}): DatosCaja {
  return {
    hoy: '2026-11-10',
    movs: MOVS,
    saldos: { bancos: 122_099_27n, stripe: 8_760_00n },
    confirmado: { periodo: '2026-10', saldo: 48_210_55n },
    calls: [LLAMADA],
    cuentas: { 1: cuenta(10_000_00n), 2: cuenta(0n) },
    socios: { 1: 'Fundador 1 · Ana', 2: 'Fundador 2 · Beto' },
    recurrentes: [
      {
        plantilla: CONTADOR,
        fecha: '2026-11-01',
        estado: 'registrado',
        entryId: 'e10',
        facturaDel: null,
      },
      {
        plantilla: VERCEL,
        fecha: '2026-11-28',
        estado: 'proximo',
        entryId: null,
        facturaDel: null,
      },
      {
        plantilla: CONTADOR,
        fecha: '2026-12-01',
        estado: 'proximo',
        entryId: null,
        facturaDel: null,
      },
      {
        plantilla: VERCEL,
        fecha: '2026-12-28',
        estado: 'proximo',
        entryId: null,
        facturaDel: null,
      },
    ],
    impuestos: [octubre],
    ...o,
  };
}

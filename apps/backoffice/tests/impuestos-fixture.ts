import type { DocumentoMeta, ObligacionGuardada } from '@xangarro/application/corp';
import {
  estimadosDeImpuestos,
  type Declaracion,
  type MesFiscal,
  type TipoEvidencia,
} from '@xangarro/domain/corp';

import type { DatosImpuestos } from '../src/server/empresa/impuestos-view';

/**
 * Board CD-09's October 2026, seen on 10 November: September paid, and
 * October with IVA to pay and the contador's withholdings, at a loss for the
 * year so the ISR is $0.00. `datos` builds the states the board shows.
 */
const mes = (m: string, o: Partial<MesFiscal> = {}): MesFiscal => ({
  mes: m,
  ingresos: 0n,
  deducciones: 0n,
  ivaTrasladado: 0n,
  ivaAcreditable: 0n,
  retencionIsr: 0n,
  retencionIva: 0n,
  ...o,
});

export const MESES: readonly MesFiscal[] = [
  mes('2026-09', {
    ingresos: 20_000_00n,
    deducciones: 60_000_00n,
    ivaTrasladado: 3_200_00n,
    ivaAcreditable: 2_788_00n,
  }),
  mes('2026-10', {
    ingresos: 13_794_81n,
    deducciones: 40_000_00n,
    ivaTrasladado: 2_207_17n,
    ivaAcreditable: 1_640_32n,
    retencionIsr: 350_00n,
    retencionIva: 373_33n,
  }),
];

export const OCTUBRE: Declaracion = {
  periodo: '2026-10',
  isr: 0n,
  iva: 566_85n,
  retencionIsr: 350_00n,
  retencionIva: 373_33n,
  lineaImporte: 1_290_18n,
  lineaVigencia: '2026-11-17',
};

const SEPTIEMBRE: Declaracion = {
  ...OCTUBRE,
  periodo: '2026-09',
  iva: 412_00n,
  retencionIsr: 0n,
  retencionIva: 0n,
  lineaImporte: null,
  lineaVigencia: null,
};

export const obligacion = (
  periodo: string,
  estado: ObligacionGuardada['estado'],
  sinPago = false,
): ObligacionGuardada => ({
  id: `o-${periodo}`,
  plantillaId: 'impuestos_mensual',
  periodo,
  titulo: null,
  estado,
  sinPago,
});

export const papel = (tipo: TipoEvidencia, nombre: string): DocumentoMeta => ({
  id: `d-${tipo}`,
  almacen: 'pg',
  blobKey: `d-${tipo}`,
  tipo,
  carpeta: 'sat',
  titulo: tipo,
  periodo: '2026-10',
  nombre,
  mime: 'application/pdf',
  tamano: 10,
  sha256: 'a'.repeat(64),
  obligacionId: 'o-2026-10',
  entryId: null,
  retenerHasta: '2031-11-12',
  reemplazaA: null,
  subidoPor: 'f1',
  subidoEn: '2026-11-12T18:00:00Z',
});

export function datos(
  o: {
    readonly declaracion?: Declaracion | null;
    readonly estado?: ObligacionGuardada['estado'] | null;
    readonly papeles?: readonly DocumentoMeta[];
    readonly pagado?: boolean;
    readonly meses?: readonly MesFiscal[];
  } = {},
): DatosImpuestos {
  const declaraciones = new Map<string, Declaracion>([['2026-09', SEPTIEMBRE]]);
  if (o.declaracion != null) declaraciones.set('2026-10', o.declaracion);
  const obligaciones = new Map([['2026-09', obligacion('2026-09', 'pagada')]]);
  if (o.estado != null) obligaciones.set('2026-10', obligacion('2026-10', o.estado));
  const meses = o.meses ?? MESES;
  return {
    mes: '2026-10',
    hoy: '2026-11-10',
    meses,
    estimados: estimadosDeImpuestos(meses, declaraciones),
    declaraciones,
    obligaciones,
    papeles: o.papeles ?? [],
    pago: o.pagado
      ? {
          id: 'e-pago',
          fecha: '2026-11-14',
          projectId: null,
          kind: 'pago_impuestos',
          concepto: 'ISR e IVA de octubre de 2026',
          contraparte: 'SAT',
          moneda: 'MXN',
          montoOriginal: null,
          tipoCambio: null,
          deducible: false,
          source: 'manual',
          sourceRef: 'impuestos:2026-10',
          reversesEntryId: null,
          payload: { kind: 'pago_impuestos', isr: 0n, iva: 566_85n, retenciones: 723_33n },
          createdBy: 'f1',
          lines: [],
        }
      : null,
  };
}

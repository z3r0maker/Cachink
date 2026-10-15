import { formatMonth, toPesosString } from '@xangarro/domain';
import { fechaDeCargo, type PlantillaRecurrente } from '@xangarro/domain/corp';

/** Registrar's fields for a suggested charge (board CD-03). */
export interface Prefill {
  readonly plantillaId: string;
  readonly mes: string;
  /** «octubre de 2026», for the note above the form. */
  readonly nombreMes: string;
  readonly concepto: string;
  readonly contraparte: string;
  readonly moneda: 'MXN' | 'USD';
  /** Bare pesos or dollars, «20.00». */
  readonly monto: string;
  readonly categoria: string;
  /** A project id, or '' for a shared cost. */
  readonly proyecto: string;
  readonly deducible: 'si' | 'no';
  readonly fecha: string;
}

/** The form opens on the charge day; a founder corrects it to the day it was paid. */
export function prefillDe(p: PlantillaRecurrente, mes: string): Prefill {
  return {
    plantillaId: p.id,
    mes,
    nombreMes: formatMonth(mes),
    concepto: p.nombre,
    contraparte: p.contraparte ?? '',
    moneda: p.moneda,
    monto: toPesosString(p.montoEstimado),
    categoria: p.categoria,
    proyecto: p.projectId ?? '',
    deducible: p.deducible ? 'si' : 'no',
    fecha: fechaDeCargo(p.diaCargo, mes),
  };
}

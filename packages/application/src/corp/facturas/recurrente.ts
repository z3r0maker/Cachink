import { periodOf, type PlantillaRecurrente } from '@xangarro/domain/corp';

import type { RecurringTemplateRepository } from '../ports.js';
import { FacturaDesconocidaError, FacturaSinRegistrarError } from './errors.js';
import type { ReceivedInvoiceRepository } from './ports.js';

export interface HacerRecurrenteFacturaDeps {
  readonly facturas: ReceivedInvoiceRepository;
  readonly plantillas: RecurringTemplateRepository;
}

/**
 * «Hacer recurrente cada mes» on Registrar with an XML (E-11, boards CD-06h
 * and CD-01f): the supplier's template, known by its RFC, charging on the
 * invoice's day from the invoice's month for what left the bank. This
 * month is registered by this invoice; each later one, by that RFC's next.
 * A supplier already repeating keeps its template.
 */
export async function hacerRecurrenteFactura(
  deps: HacerRecurrenteFacturaDeps,
  input: { readonly uuid: string; readonly founderId: string },
): Promise<PlantillaRecurrente> {
  const f = await deps.facturas.porUuid(input.uuid);
  if (f === null) throw new FacturaDesconocidaError(input.uuid);
  if (f.estado !== 'registrada' || f.categoria === null) {
    throw new FacturaSinRegistrarError(input.uuid);
  }
  const { cfdi } = f;
  const ya = (await deps.plantillas.list()).find((p) => p.activo && p.rfc === cfdi.emisor.rfc);
  if (ya !== undefined) return ya;
  const proveedor = cfdi.emisor.nombre || cfdi.emisor.rfc;
  return deps.plantillas.ensure({
    id: `rec-${cfdi.uuid.toLowerCase()}`,
    nombre: proveedor,
    contraparte: proveedor,
    rfc: cfdi.emisor.rfc,
    categoria: f.categoria,
    moneda: 'MXN',
    montoEstimado: cfdi.total,
    diaCargo: Number(cfdi.fecha.slice(8, 10)),
    projectId: f.projectId,
    deducible: true,
    desde: periodOf(cfdi.fecha) ?? '',
    createdBy: input.founderId,
  });
}

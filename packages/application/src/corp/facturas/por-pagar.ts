import { gastoDeCfdi, pagoDeGasto, refPagoFactura } from '@xangarro/domain/corp';

import type { LedgerEntry } from '../ports.js';
import { RegistrarMovimientoUseCase } from '../registrar-movimiento.js';
import { RevertirMovimientoUseCase } from '../revertir-movimiento.js';
import { FacturaNoPorPagarError, FechaPagoAnteriorError } from './errors.js';
import { factura, proveedor, type FacturasDeps } from './registrar.js';

/**
 * An invoice on credit after it is registered (E-11, owner decision 9): it
 * is paid («Registrar pago») or cancelled («Cancelar»), never both.
 */
/** An invoice on credit, registered, neither paid nor cancelled. */
async function porPagar(deps: FacturasDeps, uuid: string) {
  const f = await factura(deps, uuid);
  const { categoria, entryId } = f;
  const abierta =
    f.estado === 'registrada' && f.cfdi.metodoPago === 'PPD' && f.pagoEntryId === null;
  if (
    !abierta ||
    categoria === null ||
    entryId === null ||
    (await deps.ledger.isReversed(entryId))
  ) {
    throw new FacturaNoPorPagarError(uuid);
  }
  return { f, categoria, entryId };
}

export interface MovimientoDeFacturaInput {
  readonly uuid: string;
  /** The day the money moved or the cancellation was decided, `YYYY-MM-DD`. */
  readonly fecha: string;
  readonly founderId: string;
}

/**
 * «Registrar pago» on the day the money left the bank (board CD-06e): the bank
 * pays the net, withholdings are owed, the IVA turns creditable. Never before
 * the invoice itself; a closed month is the ledger's to refuse.
 */
export async function registrarPagoFactura(
  deps: FacturasDeps,
  input: MovimientoDeFacturaInput,
): Promise<LedgerEntry> {
  const { f, categoria } = await porPagar(deps, input.uuid);
  if (input.fecha < f.cfdi.fecha.slice(0, 10)) throw new FechaPagoAnteriorError(input.fecha);
  const entry = await new RegistrarMovimientoUseCase(deps.ledger).execute({
    fecha: input.fecha,
    projectId: f.projectId,
    concepto: `Pago: ${f.cfdi.concepto || `factura de ${proveedor(f)}`}`,
    contraparte: proveedor(f),
    founderId: input.founderId,
    source: 'cfdi',
    sourceRef: refPagoFactura(f.cfdi.uuid),
    usd: null,
    deducible: null,
    movement: pagoDeGasto(gastoDeCfdi(f.cfdi, categoria)),
  });
  await deps.facturas.marcarPagada(f.cfdi.uuid, entry.id);
  return entry;
}

/** «Cancelar»: the supplier cancelled it or it came wrong; its expense is reversed. */
export async function cancelarFactura(
  deps: FacturasDeps,
  input: MovimientoDeFacturaInput & { readonly motivo: string },
): Promise<LedgerEntry> {
  const { f, entryId } = await porPagar(deps, input.uuid);
  const reversa = await new RevertirMovimientoUseCase(deps.ledger).execute({
    entryId,
    fecha: input.fecha,
    motivo: input.motivo,
    founderId: input.founderId,
  });
  await deps.facturas.marcarCancelada(f.cfdi.uuid);
  return reversa;
}

import {
  assertDeclaracion,
  assertTransicion,
  pagoDeDeclaracion,
  PLANTILLA_IMPUESTOS,
  refPagoImpuestos,
  type Declaracion,
  type Paso,
} from '@xangarro/domain/corp';

import { instanciaDe, plantillaVigente } from './agenda/obligacion.js';
import type { AgendaRepository, DocumentRepository } from './agenda/ports.js';
import { DeclaracionFaltanteError, DeclaracionPagadaError } from './errors.js';
import type { CorpLedgerRepository, LedgerEntry } from './ports.js';
import { RegistrarMovimientoUseCase } from './registrar-movimiento.js';

/**
 * Impuestos' writes (E-13, ADR-148). The contador's figures for a month are
 * a `Declaracion`; the month's progress is the Agenda's «ISR e IVA» of that
 * period, which its papers move: figures in make it preparada, the acuse
 * presentada, and «Marcar como pagado» pagada, posting the payment.
 */
export interface DeclaracionRepository {
  porPeriodo(periodo: string): Promise<Declaracion | null>;
  /** The declarations from `desde` to `hasta` (`YYYY-MM`, inclusive). */
  lista(desde: string, hasta: string): Promise<readonly Declaracion[]>;
  guardar(d: Declaracion, founderId: string): Promise<void>;
}

export interface ImpuestosDeps {
  readonly declaraciones: DeclaracionRepository;
  readonly agenda: AgendaRepository;
  readonly documentos: DocumentRepository;
}

interface Mes {
  readonly periodo: string;
  readonly founderId: string;
}

async function estadoDe(deps: ImpuestosDeps, m: Mes) {
  const p = plantillaVigente(PLANTILLA_IMPUESTOS);
  const instancia = await instanciaDe(deps.agenda, p, m.periodo, m.founderId);
  const docs = await deps.documentos.porObligacion(instancia.id);
  return { p, instancia, evidencias: new Set(docs.map((d) => d.tipo)) };
}

/**
 * Moves the month as far as its papers allow: presentada with an acuse,
 * preparada with the contador's figures. Never back, never to pagada.
 */
export async function avanzarDeclaracion(deps: ImpuestosDeps, m: Mes): Promise<void> {
  const { instancia, evidencias } = await estadoDe(deps, m);
  const declarada = (await deps.declaraciones.porPeriodo(m.periodo)) !== null;
  let nuevo: Paso | null = null;
  if (instancia.estado === 'pendiente' || instancia.estado === 'preparada') {
    if (evidencias.has('acuse')) nuevo = 'presentada';
    else if (declarada && instancia.estado === 'pendiente') nuevo = 'preparada';
  }
  if (nuevo !== null) await deps.agenda.cambiarEstado(instancia.id, nuevo, false, m.founderId);
}

export async function guardarDeclaracion(
  deps: ImpuestosDeps,
  input: { readonly declaracion: Declaracion; readonly founderId: string },
): Promise<void> {
  const d = input.declaracion;
  assertDeclaracion(d);
  const mes = { periodo: d.periodo, founderId: input.founderId };
  const { instancia } = await estadoDe(deps, mes);
  if (instancia.estado === 'pagada') throw new DeclaracionPagadaError(d.periodo);
  await deps.declaraciones.guardar(d, input.founderId);
  await avanzarDeclaracion(deps, mes);
}

export interface PagarDeclaracionInput extends Mes {
  /** The day it was paid, `YYYY-MM-DD`. */
  readonly fecha: string;
  /** The ledger entry's concept («ISR e IVA de octubre de 2026»). */
  readonly concepto: string;
}

/**
 * «Marcar como pagado»: only a filed declaration with its comprobante, or one
 * declared en ceros. The payment posts first and is idempotent by month, so
 * a retry after a failed step never pays twice.
 */
export async function pagarDeclaracion(
  deps: ImpuestosDeps & { readonly ledger: CorpLedgerRepository },
  input: PagarDeclaracionInput,
): Promise<LedgerEntry | null> {
  const d = await deps.declaraciones.porPeriodo(input.periodo);
  if (d === null) throw new DeclaracionFaltanteError(input.periodo);
  const { p, instancia, evidencias } = await estadoDe(deps, input);
  const pago = pagoDeDeclaracion(d);
  const sinPago = pago === null;
  assertTransicion(p, { actual: instancia.estado, nuevo: 'pagada', evidencias, sinPago });
  const entry =
    pago === null
      ? null
      : await new RegistrarMovimientoUseCase(deps.ledger).execute({
          fecha: input.fecha,
          projectId: null,
          concepto: input.concepto,
          contraparte: 'SAT',
          founderId: input.founderId,
          source: 'manual',
          sourceRef: refPagoImpuestos(input.periodo),
          usd: null,
          deducible: false,
          movement: pago,
        });
  await deps.agenda.cambiarEstado(instancia.id, 'pagada', sinPago, input.founderId);
  return entry;
}

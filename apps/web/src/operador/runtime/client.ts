'use client';

/**
 * The register runtime's main-thread handle (O-06). One Worker for the tab's
 * lifetime; every call is a promise over postMessage. `navigator.storage.
 * persist()` is requested here — the register's whole honesty model is that
 * the browser not evict its database (ADR-071 §4).
 */

import type { RegistrarTicketInput } from '@xangarro/application';
import type { ReferenceTables } from '@xangarro/contracts';
import type { SyncRunResult } from '@xangarro/sync';

import type {
  BootInfo,
  CierrePara,
  CuentaPara,
  GastoPara,
  OperadorPara,
  RegistrarContext,
  SesionAbierta,
  WorkerRequest,
  WorkerResponse,
} from './protocol';
import * as calls from './calls';
import type {
  AbonoInput,
  Call,
  CancelarInput,
  CerrarCallInput,
  GastoInput,
  ProductoPara,
  TicketVivo,
  VentasTurno,
} from './calls';
import type { MarcaDelNegocio } from './negocio';
import type { RecurrenteGastoPara } from './recurrentes';
import type { AvisosPara, PendienteCrudo, ResponderAvisoCall } from './cola-shapes';
import type { TurnoVivoPara } from './turno-shapes';
import type { InventarioPara, MoverInventarioCall } from './inventario-mapa';

export interface RuntimeCounts {
  readonly pending: number;
  readonly rejected: number;
  readonly retrying: number;
}

interface Pending {
  readonly resolve: (v: unknown) => void;
  readonly reject: (e: Error) => void;
}

export class RegisterRuntime {
  readonly #worker: Worker;
  #nextId = 1;
  readonly #pending = new Map<number, Pending>();

  constructor() {
    this.#worker = new Worker(new URL('./db.worker.ts', import.meta.url), { type: 'module' });
    this.#worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const p = this.#pending.get(response.id);
      if (p === undefined) return;
      this.#pending.delete(response.id);
      if (response.ok) p.resolve(response.data);
      else p.reject(new Error(response.error));
    };
  }

  #call<T>(call: Call): Promise<T> {
    const id = this.#nextId;
    this.#nextId += 1;
    const promise = new Promise<T>((resolve, reject) => {
      this.#pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    });
    const request: WorkerRequest = { ...call, id } as WorkerRequest;
    this.#worker.postMessage(request);
    return promise;
  }

  boot(): Promise<BootInfo> {
    void navigator.storage?.persist?.().catch(() => undefined);
    return this.#call<BootInfo>({ method: 'boot' });
  }

  registrar(input: RegistrarTicketInput, ctx: RegistrarContext): Promise<{ folio: number }> {
    return this.#call<{ folio: number }>({ method: 'registrar', input, ctx });
  }

  sync(token: string | null): Promise<SyncRunResult> {
    return this.#call<SyncRunResult>({ method: 'sync', token });
  }

  counts(): Promise<RuntimeCounts> {
    return this.#call<RuntimeCounts>({ method: 'counts' });
  }

  /** O-12 · Vincular: the activation bootstrap becomes the local database. */
  vincular(tables: ReferenceTables, businessId: string): Promise<void> {
    return this.#call(calls.vincular(tables, businessId));
  }

  operadores(businessId: string, deviceId: string): Promise<readonly OperadorPara[]> {
    return this.#call(calls.operadores(businessId, deviceId));
  }

  autenticar(
    businessId: string,
    deviceId: string,
    nombre: string,
    nip: string,
  ): Promise<{ success: boolean; userId: string | null }> {
    return this.#call(calls.autenticar(businessId, deviceId, nombre, nip));
  }

  abrirCaja(
    businessId: string,
    deviceId: string,
    userId: string,
    fondoCentavos: bigint,
  ): Promise<{ turnoId: string }> {
    return this.#call(calls.abrirCaja(businessId, deviceId, userId, fondoCentavos));
  }

  turnoAbierto(businessId: string, deviceId: string): Promise<SesionAbierta | null> {
    return this.#call(calls.turnoAbierto(businessId, deviceId));
  }

  /** The business as its receipts print it (Mi negocio › Comprobantes). */
  negocio(businessId: string, deviceId: string): Promise<MarcaDelNegocio | null> {
    return this.#call(calls.negocio(businessId, deviceId));
  }

  productos(businessId: string, deviceId: string): Promise<readonly ProductoPara[]> {
    return this.#call(calls.productos(businessId, deviceId));
  }

  /** O-32 · Ventas: the open turno's tickets from the register's database. */
  ventas(businessId: string, deviceId: string, turnoId: string): Promise<VentasTurno> {
    return this.#call(calls.ventas(businessId, deviceId, turnoId));
  }

  /** O-34 · Detalle de venta: the open turno's ticket by folio. */
  ticket(businessId: string, deviceId: string, folio: number): Promise<TicketVivo> {
    return this.#call(calls.ticket(businessId, deviceId, folio));
  }

  /** O-35 · Gastos: the open turno's petty-cash expenses. */
  gastos(
    businessId: string,
    deviceId: string,
    turnoId: string,
  ): Promise<{ readonly desde: string; readonly gastos: readonly GastoPara[] }> {
    return this.#call(calls.gastos(businessId, deviceId, turnoId));
  }

  /** O-35: record a gasto of the open turno through the real use case. */
  gastar(p: GastoInput): Promise<{ readonly id: string }> {
    return this.#call(calls.gastar(p));
  }

  /** O-39 · Mi turno and Inicio: the open turno, live. */
  turnoVivo(businessId: string, deviceId: string, turnoId: string): Promise<TurnoVivoPara> {
    return this.#call(calls.turnoVivo(businessId, deviceId, turnoId));
  }

  /** O-36 · Cierre: the open turno's expected cash and figures. */
  cierre(businessId: string, deviceId: string, turnoId: string): Promise<CierrePara> {
    return this.#call(calls.cierre(businessId, deviceId, turnoId));
  }

  /** O-36: close the turno through the real use case. */
  cerrar(p: CerrarCallInput): Promise<{ readonly cierreAt: string }> {
    return this.#call(calls.cerrar(p));
  }

  /** O-32: cancel through the real use case — PIN and permission included. */
  cancelar(p: CancelarInput): Promise<{ folio: number; cashToReturnCentavos: string | null }> {
    return this.#call(calls.cancelar(p));
  }

  /** O-33 · Cobranza: every credit account from the register's database. */
  cuentas(businessId: string, deviceId: string): Promise<readonly CuentaPara[]> {
    return this.#call(calls.cuentas(businessId, deviceId));
  }

  /** O-33: record an abono through the real use case (whole; D5 a favor). */
  abonar(p: AbonoInput): Promise<{ id: string; fecha: string }> {
    return this.#call(calls.abonar(p));
  }

  /** O-24 · Inventario: stocked products and this turno's manual movements. */
  inventario(businessId: string, deviceId: string, turnoId: string): Promise<InventarioPara> {
    return this.#call({ method: 'inventario', businessId, deviceId, turnoId });
  }

  /** O-24: an entrada or a merma through the real use case. */
  moverInventario(p: Omit<MoverInventarioCall, 'method'>): Promise<{ readonly id: string }> {
    return this.#call({ ...p, method: 'moverInventario' });
  }

  /** O-27 · Registros por enviar: the outbox, grouped as the operator captured it. */
  colaPendiente(): Promise<readonly PendienteCrudo[]> {
    return this.#call({ method: 'colaPendiente' });
  }

  /** O-16 · Avisos: the owner's messages to this operator and the caja's own notices. */
  avisos(businessId: string, deviceId: string, operadorId: string): Promise<AvisosPara> {
    return this.#call({ method: 'avisos', businessId, deviceId, operadorId });
  }

  avisosLeidos(ids: readonly string[]): Promise<void> {
    return this.#call({ method: 'avisosLeidos', ids });
  }

  responderAviso(p: Omit<ResponderAvisoCall, 'method'>): Promise<{ readonly id: string }> {
    return this.#call({ ...p, method: 'responderAviso' });
  }

  /** Gastos' drawer filled from a due recurring gasto; null when it is no longer due. */
  gastoRecurrente(
    businessId: string,
    deviceId: string,
    recurrenteId: string,
  ): Promise<RecurrenteGastoPara | null> {
    return this.#call({ method: 'gastoRecurrente', businessId, deviceId, recurrenteId });
  }

  /** Pay it: the egreso and the schedule's advance, one use case. */
  pagarRecurrente(p: GastoInput & { readonly recurrenteId: string }): Promise<{ id: string }> {
    const { montoCentavos, ...rest } = p;
    return this.#call({
      ...rest,
      method: 'pagarRecurrente',
      montoCentavos: montoCentavos.toString(),
    });
  }

  terminate(): void {
    this.#worker.terminate();
    for (const p of this.#pending.values()) p.reject(new Error('runtime terminated'));
    this.#pending.clear();
  }
}

let singleton: RegisterRuntime | null = null;

/** One runtime per tab — the Worker and its database are the tab's state. */
export function registerRuntime(): RegisterRuntime {
  singleton ??= new RegisterRuntime();
  return singleton;
}

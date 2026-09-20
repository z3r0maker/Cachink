'use client';

/**
 * The register runtime's main-thread handle (O-06). One Worker for the tab's
 * lifetime; every call is a promise over postMessage. `navigator.storage.
 * persist()` is requested here — the register's whole honesty model is that
 * the browser not evict its database (ADR-071 §4).
 */

import { useEffect, useState } from 'react';

import type { RegistrarTicketInput } from '@xangarro/application';
import type { ReferenceTables } from '@xangarro/contracts';
import type { SyncRunResult } from '@xangarro/sync';

import type {
  BootInfo,
  CuentaPara,
  OperadorPara,
  RegistrarContext,
  SesionAbierta,
  VentaPara,
  WorkerRequest,
  WorkerResponse,
} from './protocol';

/** A request minus its RPC id — kept derived so it can never drift from the protocol. */
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
type Call = DistributiveOmit<WorkerRequest, 'id'>;

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
    return this.#call<void>({ method: 'vincular', tables, businessId });
  }

  operadores(businessId: string, deviceId: string): Promise<readonly OperadorPara[]> {
    return this.#call<readonly OperadorPara[]>({ method: 'operadores', businessId, deviceId });
  }

  autenticar(
    businessId: string,
    deviceId: string,
    nombre: string,
    nip: string,
  ): Promise<{ success: boolean; userId: string | null }> {
    return this.#call<{ success: boolean; userId: string | null }>({
      method: 'autenticar',
      businessId,
      deviceId,
      nombre,
      nip,
    });
  }

  abrirCaja(
    businessId: string,
    deviceId: string,
    userId: string,
    fondoCentavos: bigint,
  ): Promise<{ turnoId: string }> {
    return this.#call<{ turnoId: string }>({
      method: 'abrirCaja',
      businessId,
      deviceId,
      userId,
      fondoCentavos: fondoCentavos.toString(),
    });
  }

  turnoAbierto(businessId: string, deviceId: string): Promise<SesionAbierta | null> {
    return this.#call<SesionAbierta | null>({ method: 'turnoAbierto', businessId, deviceId });
  }

  productos(
    businessId: string,
    deviceId: string,
  ): Promise<readonly { id: string; nombre: string; precio: string; categoria: string }[]> {
    return this.#call<{ id: string; nombre: string; precio: string; categoria: string }[]>({
      method: 'productos',
      businessId,
      deviceId,
    });
  }

  /** O-32 · Ventas: the open turno's tickets from the register's database. */
  ventas(
    businessId: string,
    deviceId: string,
    turnoId: string,
  ): Promise<{ readonly desde: string; readonly ventas: readonly VentaPara[] }> {
    return this.#call<{ readonly desde: string; readonly ventas: readonly VentaPara[] }>({
      method: 'ventas',
      businessId,
      deviceId,
      turnoId,
    });
  }

  /** O-32: cancel through the real use case — PIN and permission included. */
  cancelar(p: {
    readonly businessId: string;
    readonly deviceId: string;
    readonly userId: string;
    readonly ticketId: string;
    readonly pin: string;
    readonly motivo: string;
  }): Promise<{ folio: number; cashToReturnCentavos: string | null }> {
    return this.#call<{ folio: number; cashToReturnCentavos: string | null }>({
      method: 'cancelar',
      ...p,
    });
  }

  /** O-33 · Cobranza: every credit account from the register's database. */
  cuentas(businessId: string, deviceId: string): Promise<readonly CuentaPara[]> {
    return this.#call<readonly CuentaPara[]>({ method: 'cuentas', businessId, deviceId });
  }

  /** O-33: record an abono through the real use case (whole; D5 a favor). */
  abonar(p: {
    readonly businessId: string;
    readonly deviceId: string;
    readonly clienteId: string;
    readonly montoCentavos: bigint;
    readonly metodo: string;
    readonly fecha: string;
  }): Promise<{ id: string; fecha: string }> {
    return this.#call<{ id: string; fecha: string }>({
      method: 'abonar',
      businessId: p.businessId,
      deviceId: p.deviceId,
      clienteId: p.clienteId,
      montoCentavos: p.montoCentavos.toString(),
      metodo: p.metodo,
      fecha: p.fecha,
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

export interface RuntimeStatus {
  readonly booted: boolean;
  readonly error: string | null;
}

/** For the register's screens: boot once when the shell mounts (O-11 gate). */
export function useRegisterRuntime(): RuntimeStatus {
  const [status, setStatus] = useState<RuntimeStatus>({ booted: false, error: null });
  useEffect(() => {
    const runtime = registerRuntime();
    let alive = true;
    runtime
      .boot()
      .then(() => alive && setStatus({ booted: true, error: null }))
      .catch((e: unknown) => alive && setStatus({ booted: false, error: String(e) }));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

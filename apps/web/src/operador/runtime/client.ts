'use client';

/**
 * The register runtime's main-thread handle (O-06). One Worker for the tab's
 * lifetime; every call is a promise over postMessage. `navigator.storage.
 * persist()` is requested here — the register's whole honesty model is that
 * the browser not evict its database (ADR-071 §4).
 */

import { useEffect, useState } from 'react';

import type { RegistrarTicketInput } from '@xangarro/application';
import type { SyncRunResult } from '@xangarro/sync';

import type { BootInfo, RegistrarContext, WorkerRequest, WorkerResponse } from './db.worker';

type Call =
  | { readonly method: 'boot' }
  | {
      readonly method: 'registrar';
      readonly input: RegistrarTicketInput;
      readonly ctx: RegistrarContext;
    }
  | { readonly method: 'sync'; readonly token: string | null };

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

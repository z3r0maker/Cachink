'use client';

/**
 * The register's React bindings (O-11 gate): the singleton accessor and the
 * boot-once hook the shell and screens use.
 */

import { useEffect, useState } from 'react';

import { registerRuntime } from './client';

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

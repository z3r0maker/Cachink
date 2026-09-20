'use client';

/**
 * The register's credentials, read once per mount — localStorage and
 * sessionStorage give fresh objects on every read, useless as deps.
 */

import { useState } from 'react';

import { readDevice, type DeviceCredentials } from './device-store';
import { readSesion, type SesionCaja } from './session-store';

export interface Credenciales {
  readonly device: DeviceCredentials | null;
  readonly sesion: SesionCaja | null;
}

export function useCredenciales(): Credenciales {
  const [cred] = useState<Credenciales>(() => ({ device: readDevice(), sesion: readSesion() }));
  return cred;
}

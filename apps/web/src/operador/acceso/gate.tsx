'use client';

/**
 * The register's gate (O-12, ADR-071 §1): an unlinked browser sees only
 * Acceso — never the register, never the owner's session. The gate is the
 * device's own state (its credentials and its local turno), not a cookie:
 * the register authenticates by device token, never by the owner's session.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { AccesoScreen } from './screen';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';

type Estado = 'decidiendo' | 'acceso' | 'adentro';

/**
 * Fixture-era bypass: the register's screens still render the design fixtures
 * (real data arrives with O-14+), so the suite's storageState sets this flag
 * and the gate lets the screens through. The O-12 spec runs without it and
 * walks the real door. Removed when the screens read the runtime.
 */
const DEMO_FLAG = 'xangarro.caja.demo';

export function AccesoGate(p: { readonly children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('decidiendo');

  useEffect(() => {
    if (localStorage.getItem(DEMO_FLAG) === '1') {
      setEstado('adentro');
      return;
    }
    const device = readDevice();
    if (device === null) {
      setEstado('acceso');
      return;
    }
    // Linked: in only while this caja's turno is open — Acceso re-asks the
    // NIP and fondo otherwise (the O-13 lock will reuse exactly this door).
    const runtime = registerRuntime();
    void runtime
      .boot()
      .then(() => runtime.turnoAbierto(device.businessId, device.deviceId))
      .then((sesion) => setEstado(sesion === null ? 'acceso' : 'adentro'))
      .catch(() => setEstado('acceso'));
  }, []);

  if (estado === 'decidiendo') return null;
  if (estado === 'acceso') return <AccesoScreen onListo={() => setEstado('adentro')} />;
  return p.children;
}

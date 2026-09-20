'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { CajaScreen } from './screen';
import type { CajaData, CajaScreenProps, CobroPaso, Producto } from './types';
import { registerRuntime } from '../runtime/client';
import { readDevice } from '../runtime/device-store';

/**
 * Caja for real (O-06): a linked register sells the products its own database
 * holds — the bootstrap and every pull keep them current — while an unlinked
 * one keeps the design fixture (the suite's demo flag). Everything but the
 * catalogue stays as the screen built it; the screens' full wiring is O-14+.
 */

/** The register's four chips, from whatever the business calls the product. */
function categoriaDe(esta: string): Producto['categoria'] {
  const t = esta.toLowerCase();
  if (t.includes('bebida') || t.includes('agua') || t.includes('refresco')) return 'Bebidas';
  if (t.includes('taco')) return 'Tacos';
  if (t.includes('guisado') || t.includes('orden') || t.includes('torta')) return 'Guisados';
  return 'Extras';
}

export function CajaViva(p: {
  readonly state: CajaScreenProps['state'];
  readonly paso: CobroPaso;
  readonly data: CajaData;
}): ReactNode {
  const device = readDevice();
  const [catalogo, setCatalogo] = useState<readonly Producto[] | null>(null);

  useEffect(() => {
    if (device === null) return;
    const runtime = registerRuntime();
    void runtime
      .boot()
      .then(() => runtime.productos(device.businessId, device.deviceId))
      .then((rows) =>
        setCatalogo(
          rows.map((r) => ({
            id: r.id,
            nombre: r.nombre,
            precio: BigInt(r.precio),
            categoria: categoriaDe(r.categoria),
            // Stock chips arrive with the inventario screen's real data (O-14+).
            existencias: 99,
            umbral: 0,
            icono: 'flame',
          })),
        ),
      )
      .catch((e: unknown) => console.error('catalogo', e));
  }, [device]);

  if (device === null) {
    return <CajaScreen {...p} />;
  }
  // Linked: never the fixture's pre-seeded ticket, and nothing to sell until
  // the register's own catalogue loads — a real register starts empty.
  return <CajaScreen {...p} data={{ ...p.data, catalogo: catalogo ?? [], ticket: [] }} />;
}

'use client';

import { formatFechaHora } from '@xangarro/domain';

import { Card } from '@/components';
import type { SincronizacionData } from '@/server/screens';
import { eyebrow } from '@/styles/text.css';

/**
 * «Historial» (P-11): the recent sync activity as sentences — what each phone
 * sent, what was refused, what the portal changed for the phones to pull —
 * grouped per minute by the query, newest first.
 */
type Evento = SincronizacionData['historial'][number];

const registros = (n: number) => `${n} ${n === 1 ? 'registro' : 'registros'}`;

export function describirEvento(e: Evento): string {
  const quien = e.dispositivo ?? 'Un dispositivo desvinculado';
  if (e.tipo === 'envio') return `${quien} envió ${registros(e.registros)}.`;
  if (e.tipo === 'rechazo') return `Se rechazaron ${registros(e.registros)} de ${quien}.`;
  return `Cambios en el portal: ${registros(e.registros)} para los teléfonos.`;
}

export function HistorialCard({ eventos }: { readonly eventos: readonly Evento[] }) {
  return (
    <Card>
      <div className={eyebrow} style={{ marginBottom: 12 }}>
        Historial
      </div>
      {eventos.length === 0 ? (
        <p>Aún no hay actividad de sincronización.</p>
      ) : (
        <ul
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
          aria-label="Historial de sincronización"
        >
          {eventos.map((e) => (
            <li key={`${e.tipo}-${e.dispositivo ?? ''}-${e.at}`} style={{ padding: '8px 0' }}>
              <strong>{formatFechaHora(e.at)}</strong> · {describirEvento(e)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

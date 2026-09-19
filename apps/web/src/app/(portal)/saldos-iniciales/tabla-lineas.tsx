'use client';

import { Button } from '@/components';
import type { Linea } from './lineas';

export function TablaLineas({
  lineas,
  editable,
  setLineas,
}: {
  readonly lineas: readonly Linea[];
  readonly editable: boolean;
  readonly setLineas: (fn: (ls: Linea[]) => Linea[]) => void;
}) {
  return (
    <>
      {lineas.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Saldo inicial</th>
              {editable ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <LineaRow
                key={l.clienteId}
                linea={l}
                editable={editable}
                onSaldo={(v) =>
                  setLineas((ls) => ls.map((x, j) => (j === i ? { ...x, saldo: v } : x)))
                }
                onQuitar={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'var(--gray-600)' }}>Sin saldos por cliente todavía.</p>
      )}
    </>
  );
}

function LineaRow({
  linea,
  editable,
  onSaldo,
  onQuitar,
}: {
  readonly linea: Linea;
  readonly editable: boolean;
  readonly onSaldo: (v: string) => void;
  readonly onQuitar: () => void;
}) {
  return (
    <tr>
      <td>{linea.nombre}</td>
      <td>
        <input
          aria-label={`Saldo de ${linea.nombre}`}
          value={linea.saldo}
          disabled={!editable}
          onChange={(e) => onSaldo(e.target.value)}
          style={{ width: 110, textAlign: 'right' }}
        />
      </td>
      {editable ? (
        <td>
          <Button size="sm" variant="secondary" onClick={onQuitar}>
            Quitar
          </Button>
        </td>
      ) : null}
    </tr>
  );
}

'use client';

import { formatFechaHora, formatMoney } from '@xangarro/domain';

import { KpiCard, kpiGrid } from '@/components';
import type { EquipoData } from '@/server/screens';

/**
 * The KPI row Tu equipo had on neither tab (C-4).
 *
 * A plan-quota bar stood where the design puts four tiles. The quota is
 * real and stays — it just answers a different question («how many may
 * I have?») from the one the row answers («what is my team doing?»), so
 * the two sit beside each other rather than one in the other's place.
 *
 * Every tile is counted from the rows already loaded.
 */
type Operador = EquipoData['operadores'][number];
type Dispositivo = EquipoData['dispositivos'][number];

export function KpisOperadores({ rows }: { readonly rows: readonly Operador[] }) {
  const activos = rows.filter((o) => o.active);
  const abiertos = activos.filter((o) => o.estadoTurno === 'abierto');
  const sinVincular = activos.filter((o) => o.estadoTurno === 'sin_vincular');
  const capturado = activos.reduce((t, o) => t + o.capturoHoy, 0);
  const cobrado = activos.reduce((t, o) => t + o.cobradoHoy, 0n);
  return (
    <div className={kpiGrid}>
      <KpiCard label="Operadores activos" value={`${activos.length}`} hint="Pueden entrar hoy" />
      <KpiCard
        label="Turnos abiertos"
        value={`${abiertos.length}`}
        tone={abiertos.length > 0 ? 'positive' : 'neutral'}
        hint={abiertos.length === 0 ? 'Nadie está en caja' : 'Cajas trabajando ahora'}
      />
      <KpiCard
        label="Capturado hoy"
        value={`${capturado}`}
        hint={`${formatMoney(cobrado)} cobrados`}
      />
      <KpiCard
        label="Sin vincular"
        value={`${sinVincular.length}`}
        // Not an error, but the thing to chase: an operator who has never
        // opened a shift is one whose rows will never arrive.
        tone={sinVincular.length > 0 ? 'warning' : 'neutral'}
        hint="Nunca han abierto turno"
      />
    </div>
  );
}

export function KpisDispositivos({ rows }: { readonly rows: readonly Dispositivo[] }) {
  const vivos = rows.filter((d) => d.revokedAt === null);
  const rechazados = rows.reduce((t, d) => t + d.rechazados, 0);
  const alDia = vivos.filter((d) => d.rechazados === 0);
  const ultimo = rows
    .map((d) => d.ultimoCorte)
    .filter((c): c is string => c !== null)
    .sort()
    .at(-1);
  return (
    <div className={kpiGrid}>
      <KpiCard
        label="Dispositivos vinculados"
        value={`${vivos.length}`}
        hint="Sin contar los revocados"
      />
      <KpiCard label="Al día" value={`${alDia.length}`} tone="positive" hint="Sin nada rechazado" />
      <KpiCard
        label="Registros rechazados"
        value={`${rechazados}`}
        tone={rechazados > 0 ? 'negative' : 'neutral'}
        hint={rechazados === 0 ? 'Todo llegó' : 'Revísalos en Sincronización'}
      />
      <KpiCard
        label="Último corte"
        value={ultimo === undefined ? '—' : (formatFechaHora(ultimo).split(',')[0] ?? '—')}
        hint="El más reciente de tus cajas"
      />
    </div>
  );
}

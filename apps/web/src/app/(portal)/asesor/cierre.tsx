'use client';

import { formatMoney } from '@xangarro/domain';

import { Button, Card } from '@/components';
import { fijarMetaAction } from '@/server/actions/metas';
import type { MetasPageData, NivelPosible } from '@/server/metas';
import { eyebrow } from '@/styles/text.css';

/** The choices each variant offers, as data. */
function botonesDeCierre(
  meta: NonNullable<MetasPageData['recienCerrada']>,
  niveles: readonly NivelPosible[],
): readonly {
  readonly label: string;
  readonly accion: 'subir' | 'repetir' | 'bajar';
  readonly secundario?: boolean;
}[] {
  const pct = (id: string) => niveles.find((n) => n.id === id)?.pct ?? 20;
  return meta.lograda
    ? [
        { label: `Subir el reto · +${pct('ambicioso')}%`, accion: 'subir' },
        { label: `Repetir · +${pct('reto')}%`, accion: 'repetir', secundario: true },
      ]
    : [
        { label: `Repetir · +${pct('reto')}%`, accion: 'repetir' },
        { label: `Bajar un nivel · +${pct('empujon')}%`, accion: 'bajar', secundario: true },
      ];
}

/** The month-end dialog, in both variants (P-27). */
export function CierreDialog({
  meta,
  niveles,
  onElección,
}: {
  readonly meta: NonNullable<MetasPageData['recienCerrada']>;
  readonly niveles: readonly NivelPosible[];
  onElección: (acción: 'subir' | 'repetir' | 'bajar' | 'cambiar') => void;
}) {
  const botones = botonesDeCierre(meta, niveles);
  return (
    <Card>
      <div className={eyebrow}>Se cerró tu meta de {meta.periodo}</div>
      <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>
        {meta.lograda
          ? `¡La lograste! ${formatMoney(meta.resultadoCentavos ?? 0n)}`
          : `Quedaste en ${formatMoney(meta.resultadoCentavos ?? 0n)} de ${formatMoney(meta.objetivoCentavos)}`}
      </h3>
      <p style={{ margin: '0 0 14px', color: 'inherit' }}>
        {meta.lograda
          ? 'Tu negocio hizo lo que te propusiste. ¿Qué sigue?'
          : 'No pasó nada: un mes flojo también enseña. ¿Cómo seguimos?'}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {botones.map((b) => (
          <Button
            key={b.accion}
            variant={b.secundario === true ? 'secondary' : 'primary'}
            onClick={() => onElección(b.accion)}
          >
            {b.label}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => onElección('cambiar')}>
          Cambiar
        </Button>
      </div>
    </Card>
  );
}

/** The closed branch: the dialog plus what each choice does. */
export function CierreReciente({
  data,
  onCambiar,
}: {
  readonly data: MetasPageData;
  readonly onCambiar: () => void;
}) {
  const cerrada = data.recienCerrada!;
  const eleccion = async (accion: 'subir' | 'repetir' | 'bajar' | 'cambiar') => {
    if (accion === 'cambiar') return onCambiar();
    const nivel = accion === 'subir' ? 'ambicioso' : accion === 'bajar' ? 'empujon' : cerrada.nivel;
    await fijarMetaAction({ objetivo: cerrada.objetivo, motivo: cerrada.motivo, nivel });
    window.location.reload();
  };
  return (
    <CierreDialog meta={cerrada} niveles={data.niveles} onElección={(a) => void eleccion(a)} />
  );
}

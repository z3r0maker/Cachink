import { DENOMINACIONES_MXN, formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Button, Drawer } from '@/components';
import { DIF } from '@/operador/cierre/copy';
import { desglose } from '@/operador/turno/desglose';
import { eyebrow } from '@/styles/text.css';

import * as s from './cortes.css';
import { contado, diferencia, esperado, eventos } from './derive';
import type { Corte, EstadoCorte, Evento } from './types';

const PASADO = { cuadra: 'Cuadró', falta: 'Faltó', sobra: 'Sobró' } as const;
const TONO: Record<Evento['tone'], string> = {
  plain: colors.white,
  danger: colors.redSoft,
  warning: colors.warningSoft,
  soft: colors.yellowSoft,
};

/** The 560 px side panel: the difference, the note, how the expected cash was formed, the count, the rest. */
export function Panel(p: {
  readonly c: Corte | null;
  readonly estado: EstadoCorte;
  readonly onClose: () => void;
  readonly onPedir: (c: Corte) => void;
  readonly onAclarar: (c: Corte) => void;
}) {
  const c = p.c;
  return (
    <Drawer
      open={c !== null}
      onOpenChange={(o) => (o ? undefined : p.onClose())}
      eyebrow="Corte de turno"
      heading={c?.operador ?? ''}
      headerTone={c?.tint}
      width={560}
      description={c ? `${c.caja} · ${c.dia} · ${c.horario}` : undefined}
      actions={
        c ? <Acciones c={c} estado={p.estado} onPedir={p.onPedir} onAclarar={p.onAclarar} /> : null
      }
    >
      {c ? <Cuerpo c={c} /> : null}
    </Drawer>
  );
}

function Cuerpo({ c }: { readonly c: Corte }) {
  const d = diferencia(c);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className={eyebrow}>{`${c.caja} · ${c.dia} · ${c.horario}`}</div>
      <div className={s.grande} style={{ background: DIF[d.tipo].bg }}>
        <div className={eyebrow}>{PASADO[d.tipo]}</div>
        <div className={s.cifra}>{formatMoney(d.monto)}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
          <span className={s.linea}>{`Esperado ${formatMoney(esperado(c))}`}</span>
          <span className={s.linea}>{`Contado ${formatMoney(contado(c))}`}</span>
        </div>
      </div>
      {c.nota ? (
        <div className={s.nota}>
          <div
            className={eyebrow}
          >{`Nota de ${c.operador.split(' ')[0] ?? ''} · ${c.motivo ?? ''}`}</div>
          <div className={s.notaTexto}>{`«${c.nota}»`}</div>
        </div>
      ) : null}
      <Formacion c={c} />
      <Conteo c={c} />
      <Eventos eventos={eventos(c)} />
    </div>
  );
}

function Formacion({ c }: { readonly c: Corte }) {
  const filas = [
    ...desglose({ ...c, gastosEfectivo: c.gastosCaja }),
    ['Esperado', formatMoney(esperado(c))] as const,
  ];
  return (
    <div className={s.seccion}>
      <div className={eyebrow}>Cómo se formó lo esperado</div>
      <div className={s.tabla}>
        {filas.map(([label, value]) => (
          <div key={label} className={s.renglon}>
            {label}
            <span
              className={s.valor}
              style={{ color: label.startsWith('Gastos') ? colors.redText : colors.black }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Every denomination; the ones not counted sit on gray. The file also grays
 * their «×0» (gray-400, 2.4:1 on gray-100, under AA), so the count keeps
 * gray-600 and the tile alone marks the zero (plan §4b).
 */
function Conteo({ c }: { readonly c: Corte }) {
  return (
    <div className={s.seccion}>
      <div className={eyebrow}>Conteo que capturó</div>
      <div className={s.denoms}>
        {DENOMINACIONES_MXN.map((d) => {
          const n = c.conteo[d.pesos] ?? 0;
          return (
            <div
              key={d.pesos}
              className={s.denom}
              style={{ background: n === 0 ? colors.gray100 : colors.white }}
            >
              {`$${d.pesos}`}
              <span style={{ marginLeft: 'auto', color: colors.gray600 }}>{`×${n}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Eventos({ eventos }: { readonly eventos: readonly Evento[] }) {
  return (
    <div className={s.seccion}>
      <div className={eyebrow}>Qué más pasó en el turno</div>
      {eventos.map((e) => (
        <div key={e.label} className={s.evento} style={{ background: TONO[e.tone] }}>
          <span style={{ flex: 1, minWidth: 0 }}>{e.label}</span>
          <span className={s.eventoValor}>{e.value}</span>
        </div>
      ))}
    </div>
  );
}

function Acciones(p: {
  readonly c: Corte;
  readonly estado: EstadoCorte;
  readonly onPedir: (c: Corte) => void;
  readonly onAclarar: (c: Corte) => void;
}) {
  const label =
    p.estado === 'Cuadró'
      ? 'Sin nada que aclarar'
      : p.estado === 'Aclarado'
        ? 'Ya está aclarado'
        : 'Marcar como aclarado';
  return (
    <>
      <Button variant="secondary" onClick={() => p.onPedir(p.c)}>
        Pedir aclaración
      </Button>
      <Button disabled={p.estado !== 'Por aclarar'} onClick={() => p.onAclarar(p.c)}>
        {label}
      </Button>
    </>
  );
}

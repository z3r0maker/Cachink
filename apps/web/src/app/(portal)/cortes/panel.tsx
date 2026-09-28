import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Button, Don, Drawer } from '@/components';
import { DIF } from '@xangarro/caja/cierre';

import { EstadoPill } from './columnas';
import { Conteo } from './conteo';
import { contado, diferencia, esperado, eventos, horaCierre, primerNombre } from './derive';
import * as s from './panel.css';
import type { Corte, EstadoCorte, Evento } from './types';

const DICE = { cuadra: 'Cuadró', falta: 'Falta', sobra: 'Sobra' } as const;
const TONO: Record<Evento['tone'], string> = {
  plain: colors.white,
  danger: colors.redSoft,
  warning: colors.warningSoft,
  soft: colors.yellowSoft,
};

/** The corte's side panel: the three figures, the explanation, how the cash was formed, the count, the rest. */
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
      status={c ? <EstadoPill estado={p.estado} /> : null}
      heading={c?.operador ?? ''}
      subtitle={c ? `${c.caja} · ${c.dia} · ${c.horario}` : undefined}
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
  return (
    <div className={s.cuerpo}>
      <Cifras c={c} />
      {c.motivo || c.nota ? <Explicacion c={c} /> : null}
      <Formacion c={c} />
      <Conteo conteo={c.conteo} />
      <Eventos eventos={eventos(c)} />
    </div>
  );
}

/** Esperado · Contado · the difference, its cell tinted by direction. */
function Cifras({ c }: { readonly c: Corte }) {
  const d = diferencia(c);
  const tinta = { color: DIF[d.tipo].color };
  return (
    <div className={s.cifras}>
      <div className={s.cifraCelda}>
        <span className={s.cifraEtiqueta}>Esperado</span>
        <span className={s.cifraValor}>{formatMoney(esperado(c))}</span>
      </div>
      <div className={s.cifraCelda}>
        <span className={s.cifraEtiqueta}>Contado</span>
        <span className={s.cifraValor}>{formatMoney(contado(c))}</span>
      </div>
      <div className={s.cifraCelda} style={{ background: DIF[d.tipo].bg }}>
        <span className={s.cifraEtiqueta} style={tinta}>
          {DICE[d.tipo]}
        </span>
        <span className={s.cifraValor} style={tinta}>
          {formatMoney(d.monto)}
        </span>
      </div>
    </div>
  );
}

/** The reason the operator picked at close and, when she wrote one, her note. */
function Explicacion({ c }: { readonly c: Corte }) {
  const quien = primerNombre(c);
  return (
    <>
      <section className={s.seccion}>
        <h3 className={s.ceja}>{`Lo que explicó ${quien}`}</h3>
        <div className={s.nota}>
          {c.motivo ? <span className={s.motivo}>{c.motivo}</span> : null}
          {c.nota ? <p className={s.notaTexto}>{`«${c.nota}»`}</p> : null}
          <span className={s.meta}>{`Lo dejó al cerrar, a las ${horaCierre(c)}`}</span>
        </div>
      </section>
      {diferencia(c).tipo === 'cuadra' ? null : (
        <div className={s.don}>
          <Don pose="preocupado" size={44} />
          <span>{`${quien} ya explicó qué pasó. Si se repite, platíquenlo.`}</span>
        </div>
      )}
    </>
  );
}

/** The four parts of the expected cash, as the owner reads them. */
const formacion = (c: Corte): readonly (readonly [string, string])[] => [
  ['Fondo con el que abrió', formatMoney(c.fondo)],
  ['Ventas en efectivo', formatMoney(c.ventasEfectivo)],
  ['Abonos de fiado en efectivo', formatMoney(c.abonosEfectivo)],
  ['Gastos pagados de la caja', `${c.gastosCaja > 0n ? '−' : ''}${formatMoney(c.gastosCaja)}`],
];

function Formacion({ c }: { readonly c: Corte }) {
  return (
    <section className={s.seccion}>
      <h3 className={s.ceja}>Cómo se formó lo esperado</h3>
      <div className={s.tabla}>
        {formacion(c).map(([label, value]) => (
          <div key={label} className={s.renglon}>
            <span>{label}</span>
            <span
              className={s.monto}
              style={{ color: value.startsWith('−') ? colors.redText : colors.black }}
            >
              {value}
            </span>
          </div>
        ))}
        <div className={s.total}>
          <span>Esperado en caja</span>
          <span className={s.monto}>{formatMoney(esperado(c))}</span>
        </div>
      </div>
    </section>
  );
}

function Eventos({ eventos }: { readonly eventos: readonly Evento[] }) {
  return (
    <section className={s.seccion}>
      <h3 className={s.ceja}>Qué más pasó en el turno</h3>
      {eventos.map((e) => (
        <div key={e.label} className={s.evento} style={{ background: TONO[e.tone] }}>
          <span>{e.label}</span>
          <span className={s.monto}>{e.value}</span>
        </div>
      ))}
    </section>
  );
}

const ETIQUETA: Record<EstadoCorte, string> = {
  Cuadró: 'Sin nada que aclarar',
  Aclarado: 'Ya está aclarado',
  'Por aclarar': 'Marcar como aclarado',
};

function Acciones(p: {
  readonly c: Corte;
  readonly estado: EstadoCorte;
  readonly onPedir: (c: Corte) => void;
  readonly onAclarar: (c: Corte) => void;
}) {
  return (
    <div className={s.pie}>
      <div className={s.botones}>
        <span style={{ flex: 1, display: 'flex', minWidth: 200 }}>
          <Button full disabled={p.estado !== 'Por aclarar'} onClick={() => p.onAclarar(p.c)}>
            {ETIQUETA[p.estado]}
          </Button>
        </span>
        <Button variant="secondary" onClick={() => p.onPedir(p.c)}>
          {`Preguntarle a ${primerNombre(p.c)}`}
        </Button>
      </div>
      <p className={s.pieNota}>
        Tu pregunta le llega a su caja como aviso. Lo que conteste aparece en tus Avisos.
      </p>
    </div>
  );
}

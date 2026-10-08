import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { OPERADOR_BASE } from '@xangarro/caja';
import { Chip, Panel, Tile } from '../ui/panel';
import * as p from '../ui/panel.css';
import type { Reintento } from '@xangarro/caja';
import {
  estadoFila,
  lineaIntento,
  type EstadoFila,
  type Fase,
  type RegistroEnCola,
} from '@xangarro/caja/pendientes';
import * as i from './intentos.css';
import * as s from './pendientes.css';

const RECIBO =
  'M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM12 17V7M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8';
const SALIDA = 'M12 3v12M7 10l5 5 5-5M4 21h16';
const ENTRADA = 'M12 21V9M7 14l5-5 5 5M4 3h16';
const MOVER = 'M7 7h13l-4-4M17 17H4l4 4';

const TIPO = {
  venta: { tint: colors.greenSoft, icon: RECIBO, color: colors.greenText, signo: '' },
  gasto: { tint: colors.redSoft, icon: SALIDA, color: colors.redText, signo: '−' },
  abono: { tint: colors.greenSoft, icon: ENTRADA, color: colors.greenText, signo: '' },
  movimiento: { tint: colors.blueSoft, icon: MOVER, color: colors.blueText, signo: '' },
} as const;

/** «La cola»: each record with its kind, state, time and amount; or «Nada pendiente». */
export function ListaCola(props: {
  readonly cola: readonly RegistroEnCola[];
  readonly fase: Fase;
  readonly offline: boolean;
  /** «el portal de Pedro», or «el portal del dueño» on a linked caja. */
  readonly portal?: string;
  /** The clock and the engine's retry, for each row's last and next attempt (DS-07). */
  readonly ahora?: number;
  readonly reintento?: Reintento | null;
}) {
  const ahora = props.ahora ?? Date.now();
  const orden = props.cola.length ? <span className={s.orden}>Se envían en este orden</span> : null;
  return (
    <Panel label="La cola" count={props.cola.length} action={orden}>
      {props.cola.map((r) => (
        <Fila
          key={r.id}
          r={r}
          estado={estadoFila(props.fase, props.offline, r)}
          linea={lineaIntento(r, ahora, props.reintento ?? null)}
        />
      ))}
      {props.cola.length === 0 ? (
        <NadaPendiente portal={props.portal ?? 'el portal de Pedro'} />
      ) : null}
    </Panel>
  );
}

const CHIP: Readonly<Record<EstadoFila, { color: string; bg: string; dot: string }>> = {
  Enviando: { color: colors.blueText, bg: colors.blueSoft, dot: colors.blueText },
  'En reintento': { color: colors.warningText, bg: colors.warningSoft, dot: colors.warning },
  'Esperando conexión': { color: colors.warningText, bg: colors.warningSoft, dot: colors.warning },
  'En cola': { color: colors.warningText, bg: colors.warningSoft, dot: colors.warning },
};

function Fila({
  r,
  estado,
  linea,
}: {
  readonly r: RegistroEnCola;
  readonly estado: EstadoFila;
  /** DS-07's gray line; null for a row never tried. */
  readonly linea: string | null;
}) {
  const t = TIPO[r.tipo];
  const c = CHIP[estado];
  return (
    <div className={s.fila}>
      <Tile icon={t.icon} tint={t.tint} size={48} glyph={22} />
      <span className={s.filaText}>
        <span className={s.filaTitulo}>{r.titulo}</span>
        <span className={s.filaDetalle}>{r.detalle}</span>
        {linea === null ? null : <span className={i.linea}>{linea}</span>}
      </span>
      <Chip label={estado} color={c.color} bg={c.bg} dot={c.dot} />
      <span className={s.hora}>{r.hora}</span>
      <span className={s.monto} style={{ color: t.color }}>
        {r.monto === null ? '' : `${t.signo}${formatMoney(r.monto)}`}
      </span>
    </div>
  );
}

function NadaPendiente({ portal }: { readonly portal: string }) {
  return (
    <div className={s.vacia}>
      <span className={s.vaciaTitulo}>Nada pendiente</span>
      <span className={p.rowDetail}>
        {`Todo lo que capturaste ya está en ${portal}. Puedes cerrar el turno cuando quieras.`}
      </span>
      <Link href={`${OPERADOR_BASE}/cierre`} className={p.primaryBtn} style={{ marginTop: 8 }}>
        Ir al cierre de turno
      </Link>
    </div>
  );
}

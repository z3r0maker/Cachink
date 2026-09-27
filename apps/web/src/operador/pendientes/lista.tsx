import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { OPERADOR_BASE } from '../shell/nav';
import { Chip, Panel, Tile } from '../ui/panel';
import * as p from '../ui/panel.css';
import { estadoFila, type Fase } from './derive';
import * as s from './pendientes.css';
import type { RegistroEnCola } from './types';

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
}) {
  const estado = estadoFila(props.fase, props.offline);
  const orden = props.cola.length ? <span className={s.orden}>Se envían en este orden</span> : null;
  return (
    <Panel label="La cola" count={props.cola.length} action={orden}>
      {props.cola.map((r) => (
        <Fila key={r.id} r={r} estado={estado} />
      ))}
      {props.cola.length === 0 ? (
        <NadaPendiente portal={props.portal ?? 'el portal de Pedro'} />
      ) : null}
    </Panel>
  );
}

function Fila({
  r,
  estado,
}: {
  readonly r: RegistroEnCola;
  readonly estado: ReturnType<typeof estadoFila>;
}) {
  const t = TIPO[r.tipo];
  const enviando = estado === 'Enviando';
  const chipColor = enviando ? colors.blueText : colors.warningText;
  return (
    <div className={s.fila}>
      <Tile icon={t.icon} tint={t.tint} size={48} glyph={22} />
      <span className={s.filaText}>
        <span className={s.filaTitulo}>{r.titulo}</span>
        <span className={s.filaDetalle}>{r.detalle}</span>
      </span>
      <Chip
        label={estado}
        color={chipColor}
        bg={enviando ? colors.blueSoft : colors.warningSoft}
        dot={enviando ? colors.blueText : colors.warning}
      />
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

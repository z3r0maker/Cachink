'use client';

import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { Note } from '../ui/note';
import { OpMain } from '../ui/parts';
import { heroe, intro, type Fase } from './derive';
import { ListaCola } from './lista';
import * as s from './pendientes.css';
import type { PendientesScreenProps } from './types';
import { usePendientes } from './use-pendientes';

const SYNC = 'M21 11a9 9 0 0 0-15-5.5L3 8m0-5v5h5m-5 3a9 9 0 0 0 15 5.5l3-2.5m0 5v-5h-5';
const FONDO: Record<Fase, string> = {
  espera: colors.warningSoft,
  enviando: colors.blueSoft,
  enviado: colors.greenSoft,
};

/** Operador · Registros por enviar: the local queue, its retry, and the rule not to lose it. */
export function PendientesScreen({ state, cola: inicial }: PendientesScreenProps) {
  const x = usePendientes(inicial);
  return (
    <OpMain top={22} narrow>
      <div>
        <h1 className={s.titulo}>Registros por enviar</h1>
        <p className={s.intro}>{intro(x.cola.length === 0)}</p>
      </div>
      <HeroeCola x={x} />
      {state === 'happy' ? (
        <ListaCola cola={x.cola} fase={x.fase} offline={x.offline} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={SYNC}
          emptyTitle="Nada pendiente"
          emptyBody="Todo lo que capturaste ya está en el portal de Pedro."
          errorTitle="No pudimos leer la cola de este navegador"
        />
      )}
      <Note bg={colors.yellowSoft} padding="14px 16px" textColor={colors.ink}>
        Nada se pierde: lo capturado vive en este navegador hasta que suba. No cierres la pestaña ni
        borres los datos del sitio. El turno no se puede cerrar mientras haya algo en la cola,
        porque el efectivo esperado se calcula con estas ventas.
      </Note>
    </OpMain>
  );
}

/** The hero changes with the phase: amber waiting, blue sending (spinning), green sent. */
function HeroeCola({ x }: { readonly x: ReturnType<typeof usePendientes> }) {
  const h = heroe(x.fase, x.cola, x.enCola);
  return (
    <div className={s.heroe} style={{ background: FONDO[x.fase] }}>
      <span className={s.heroeTile}>
        <span className={x.fase === 'enviando' ? s.girando : undefined} style={{ display: 'grid' }}>
          <Icon path={SYNC} size={24} strokeWidth={2.4} />
        </span>
      </span>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className={s.heroeTitulo}>{h.titulo}</div>
        <div className={s.heroeCuerpo}>{h.cuerpo}</div>
      </div>
      <button
        type="button"
        className={s.reintentar}
        data-onyellow=""
        data-enviando={x.fase === 'enviando' ? '' : undefined}
        aria-busy={x.fase === 'enviando'}
        onClick={x.reintentar}
      >
        {h.boton}
      </button>
    </div>
  );
}

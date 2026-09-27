import { Don } from '@/components/don/don';

import { OperadorEstado } from '../estado';
import { ICONS } from '../shell/nav';
import { StatRow } from '../ui/panel';
import { OpMain } from '../ui/parts';
import { heroFor, saludo } from './copy';
import { HeroCard } from './hero';
import * as s from './inicio.css';
import { kpisFor } from './kpis';
import { DeParteDe, ParaHoy, UltimosCortes } from './lists';
import type { InicioData, InicioScreenProps } from './types';

/**
 * Operador · Inicio: not a dashboard, it answers «what do I do now».
 * Don Cuentas waves once, here; the shared states replace «Para hoy» only.
 */
export function InicioScreen({ state, data }: InicioScreenProps) {
  return (
    <OpMain top={24}>
      <Saludo data={data} />
      <HeroCard hero={heroFor(data)} />
      <StatRow items={kpisFor(data)} />
      <div className={s.columns}>
        {state === 'happy' ? (
          <ParaHoy
            tareas={data.tareas}
            cerrado={data.situacion === 'turno-cerrado' || !data.turno}
          />
        ) : (
          <OperadorEstado
            mode={state}
            icon={ICONS.inicio}
            emptyTitle="Nada pendiente para hoy"
            emptyBody="Ni gastos recurrentes, ni productos por reponer, ni clientes atrasados. Sigue cobrando."
            errorTitle="No pudimos cargar tus pendientes"
          />
        )}
        <div className={s.side}>
          <DeParteDe dueno={data.dueno} mensajes={data.mensajes} />
          <UltimosCortes cortes={data.cortes} />
        </div>
      </div>
    </OpMain>
  );
}

function Saludo({ data }: { readonly data: InicioData }) {
  const t = data.situacion === 'turno-cerrado' ? null : data.turno;
  return (
    <div className={s.greeting}>
      <Don pose="hola" size={116} />
      <div className={s.greetingText}>
        <div className={s.bubble}>
          <span className={s.tail} aria-hidden="true" />
          <h1 className={s.h1}>{saludo(data)}</h1>
        </div>
        <span className={s.fecha}>{data.fecha}</span>
      </div>
      <span className={s.turnoChip}>
        <span className={t ? s.greenDot : `${s.greenDot} ${s.grayDot}`} aria-hidden="true" />
        {t ? (
          <>
            Turno abierto desde las <b className={`${s.figure} ${s.mono}`}>{t.desde}</b>
          </>
        ) : (
          'Turno cerrado'
        )}
      </span>
    </div>
  );
}

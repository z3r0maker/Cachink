'use client';

import { OperadorEstado } from '../estado';
import { OpMain } from '../ui/parts';
import * as t from '../ui/title.css';
import * as s from './cierre.css';
import { Conteo } from './conteo';
import { Banda, Hecho } from './hecho';
import { Diferencia, Esperado, Explica } from './lado';
import { Resumen } from './resumen';
import type { CierreData, CierreScreenProps } from './types';
import { useCierre, type Cierre } from './use-cierre';

/** Wallet glyph from the file, for the empty and error tiles. */
const CARTERA = 'M3 7h18v10H3V7Zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5';

/** Operador · Cierre de turno: count by denomination against the expected cash, explain, close. */
export function CierreScreen({ state, data, cerrarVivo }: CierreScreenProps) {
  const x = useCierre(data, cerrarVivo);
  return (
    <OpMain top={22}>
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Cierre de turno</h1>
        <span
          className={t.pageSub}
        >{`${data.operador} · ${data.caja} · ${data.desde} a ${data.hasta}`}</span>
      </div>
      {x.pendientes > 0 && !x.cerrado ? <Banda x={x} /> : null}
      {state === 'happy' ? (
        <Cuerpo x={x} data={data} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={CARTERA}
          emptyTitle="No hay nada que cerrar"
          emptyBody="Este turno no tiene movimientos. Puedes cerrarlo sin conteo cuando quieras."
          errorTitle="No pudimos calcular tu corte"
        />
      )}
    </OpMain>
  );
}

function Cuerpo({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  if (x.cerrado) return <Hecho x={x} data={data} />;
  return (
    <div className={s.grid}>
      <div className={s.columna}>
        <Conteo x={x} />
      </div>
      <div className={s.columna}>
        <Esperado x={x} data={data} />
        <Diferencia x={x} />
        {x.dif.tipo === 'cuadra' ? null : <Explica x={x} dueno={data.dueno} />}
        <Resumen x={x} r={data.resumen} />
      </div>
    </div>
  );
}

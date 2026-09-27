'use client';

import { OperadorEstado } from '../estado';
import { PageHead } from '../ui/panel';
import { OpMain } from '../ui/parts';
import { Banda } from './banda';
import { Cerrar } from './cerrar';
import * as s from './cierre.css';
import { Conteo } from './conteo';
import { Hecho } from './hecho';
import { Diferencia, Esperado } from './lado';
import { Resumen } from './resumen';
import type { CierreData, CierreScreenProps } from './types';
import { useCierre, type Cierre } from './use-cierre';

/** Wallet glyph from the file, for the empty and error tiles. */
const CARTERA = 'M3 7h18v10H3V7Zm9 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5';

/** Operador · Cierre de turno: count by denomination against the expected cash, explain, close. */
export function CierreScreen({ state, data, cerrarVivo }: CierreScreenProps) {
  const x = useCierre(data, cerrarVivo);
  if (state === 'happy' && x.cerrado) {
    return (
      <OpMain top={22}>
        <Hecho x={x} data={data} />
      </OpMain>
    );
  }
  return (
    <OpMain top={22}>
      <PageHead
        title="Cierre de turno"
        sub={`${data.operador}, ${data.caja}, de ${data.desde} a ${data.hasta}`}
      />
      {x.pendientes > 0 ? <Banda x={x} /> : null}
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
  return (
    <>
      <Resumen x={x} t={data.resumen} />
      <div className={s.grid}>
        <Conteo x={x} />
        <div className={s.columna}>
          <Esperado x={x} data={data} />
          <Diferencia x={x} dueno={data.dueno} />
          <Cerrar x={x} />
        </div>
      </div>
    </>
  );
}

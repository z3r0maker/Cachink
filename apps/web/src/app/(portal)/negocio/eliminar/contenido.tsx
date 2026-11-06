'use client';

import { ScreenBody } from '@/components';
import type { EliminarData } from '@/server/cuenta/pagina';

import { Confirmar } from './confirmar';
import * as s from './eliminar.css';
import { Descarga, QuePasa } from './pasos';

/** The three steps, or the error state with a retry when the page could not load. */
export function Contenido(props: { readonly data: EliminarData | null; readonly actual: string }) {
  const { data } = props;
  return (
    <ScreenBody state={data === null ? 'error' : 'happy'} onRetry={() => window.location.reload()}>
      {data === null ? null : (
        <div className={s.pila}>
          <Descarga data={data} actual={props.actual} />
          <QuePasa data={data} />
          <Confirmar email={data.email} />
        </div>
      )}
    </ScreenBody>
  );
}

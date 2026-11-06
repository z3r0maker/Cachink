'use client';

import { ScreenBody } from '@/components';

import type { PrivacidadData } from './datos';
import { AvisoNuevo, TuAviso, useTexto } from './aviso';
import { Novedades } from './novedades';
import * as s from './privacidad.css';
import { Retirar, TusDatos } from './tus-datos';

/** The page's column: the title, then the cards; the error state when it could not load. */
export function PrivacidadPantalla({ data }: { readonly data: PrivacidadData | null }) {
  const t = useTexto();
  return (
    <div className={s.pila}>
      <h1 className={s.titulo}>Privacidad y mis datos</h1>
      <p className={s.bajada}>
        Lo que aceptaste, lo que puedes cambiar y cómo llevarte o borrar tus datos.
      </p>
      <ScreenBody
        state={data === null ? 'error' : 'happy'}
        onRetry={() => window.location.reload()}
      >
        {data === null ? null : (
          <div className={s.pila}>
            {data.nuevo === null ? null : <AvisoNuevo nuevo={data.nuevo} leer={t.abrir} />}
            <div className={s.dos}>
              <TuAviso aceptado={data.aceptado} ver={t.abrir} />
              <Novedades inicial={data.novedades} />
            </div>
            <TusDatos dueno={data.dueno} />
            <Retirar dueno={data.dueno} />
            {t.drawer}
          </div>
        )}
      </ScreenBody>
    </div>
  );
}

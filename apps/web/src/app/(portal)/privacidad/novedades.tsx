'use client';

import { useState, useTransition } from 'react';

import { Banner, Switch } from '@/components';
import { cambiarNovedades } from '@/server/actions/privacidad';

import * as s from './privacidad.css';

/**
 * The novedades switch (ADR-137): it saves at once, as a new ledger row. A
 * failure puts it back and says nothing changed.
 */
function useNovedades(inicial: boolean) {
  const [on, setOn] = useState(inicial);
  const [nota, setNota] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const cambiar = (v: boolean) => {
    setOn(v);
    startTransition(async () => {
      const r = await cambiarNovedades(v);
      if (!r.ok) {
        setOn(!v);
        setNota(null);
        return setError(r.message);
      }
      setError(null);
      setNota(v ? 'Listo, te mandaremos novedades.' : 'Listo, ya no te mandaremos novedades.');
    });
  };
  return { on, nota, error, pending, cambiar };
}

export function Novedades({ inicial }: { readonly inicial: boolean }) {
  const { on, nota, error, pending, cambiar } = useNovedades(inicial);
  return (
    <section className={s.tarjeta} aria-labelledby="pv-nov">
      <span className={s.ceja}>Novedades y consejos</span>
      <div className={s.switchFila}>
        <span className={s.filaTexto}>
          <h2 id="pv-nov" className={s.h2}>
            Correos de novedades
          </h2>
          <span className={s.sub}>
            Ideas para tu negocio y lo nuevo de Xangarro, de vez en cuando.
          </span>
        </span>
        <Switch
          checked={on}
          onCheckedChange={cambiar}
          label="Correos de novedades"
          disabled={pending}
        />
      </div>
      <p className={s.sub}>
        Los correos del servicio llegan siempre: cobros, avisos de tu cuenta y de tu caja.
      </p>
      {nota === null ? null : (
        <p role="status" className={s.ok}>
          {nota}
        </p>
      )}
      {error === null ? null : <Banner tone="critical" title={error} />}
    </section>
  );
}

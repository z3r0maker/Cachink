'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Banner, Input } from '@/components';
import { eliminarCuenta } from '@/server/actions/eliminar-cuenta';

import * as s from './eliminar.css';
import { Cabeza } from './pasos';

/**
 * Step 3 of «Eliminar tu cuenta»: the password, once, then the red button. A
 * wrong password marks the field; anything else shows that nothing changed.
 * Done, the session is gone and the public page shows the folio.
 */
function useEliminar() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [campo, setCampo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const enviar = () =>
    startTransition(async () => {
      const r = await eliminarCuenta(password);
      if (r.ok) return router.replace('/eliminacion/programada');
      if (r.campo === 'password') {
        setCampo(r.message);
        return setError(null);
      }
      setCampo(null);
      setError(r.message);
    });
  const escribir = (v: string) => {
    setPassword(v);
    setCampo(null);
  };
  return { password, escribir, campo, error, pending, enviar };
}

export function Confirmar({ email }: { readonly email: string }) {
  const f = useEliminar();
  return (
    <section className={s.paso} aria-label="Confirma con tu contraseña">
      <Cabeza
        n={3}
        titulo="Confirma con tu contraseña"
        sub="Se cierra la sesión de todos y se desconectan tus cajas. Lo que no se haya enviado desde una caja se pierde."
      />
      <form
        className={s.confirmar}
        onSubmit={(e) => {
          e.preventDefault();
          f.enviar();
        }}
      >
        <span className={s.campo}>
          <Input
            type="password"
            autoComplete="current-password"
            labelText={`Contraseña de ${email}`}
            value={f.password}
            onChange={(e) => f.escribir(e.target.value)}
            error={f.campo ?? undefined}
            data-testid="eliminar-password"
          />
        </span>
        <button type="submit" className={s.boton} disabled={f.pending} aria-busy={f.pending}>
          {f.pending
            ? 'Eliminando…'
            : f.error === null
              ? 'Eliminar mi cuenta'
              : 'Intentar otra vez'}
        </button>
      </form>
      {f.error === null ? null : <Banner tone="critical" title={f.error} />}
    </section>
  );
}

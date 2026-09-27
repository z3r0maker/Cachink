'use client';

import { LockKeyhole, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components';
import { restablecerContrasena } from '@/server/actions/auth-links';

import { CampoContrasena } from '../../_publico/contrasena';
import { enlace, nota, pieTexto } from '../../_publico/publico.css';
import { form, hueco } from '../recuperar/recuperar.css';
import { TarjetaAcceso } from '../recuperar/tarjeta';
import { PistaIgual, PistaLargo } from './pistas';

const NO_COINCIDEN = 'Las dos contraseñas no coinciden. Escríbelas otra vez.';

/** New password; saving it spends the link, ends every other session and signs in. */
function useReset(token: string) {
  const [password, setPassword] = useState('');
  const [otra, setOtra] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otra !== password) return setError(NO_COINCIDEN);
    startTransition(async () => {
      const r = await restablecerContrasena(token, password);
      if (!r.ok) return setError(r.message);
      router.replace('/');
      router.refresh();
    });
  };
  const cambia = (set: (v: string) => void) => (v: string) => {
    set(v);
    setError(null);
  };
  return {
    ...{ password, otra, visible, setVisible, error, pending, submit },
    onPassword: cambia(setPassword),
    onOtra: cambia(setOtra),
  };
}

function Campos({ f }: { readonly f: ReturnType<typeof useReset> }) {
  return (
    <>
      <CampoContrasena
        etiqueta="Contraseña nueva"
        autoComplete="new-password"
        value={f.password}
        onChange={f.onPassword}
        testId="reset-password"
        visible={f.visible}
        onVisible={f.setVisible}
        pista={<PistaLargo password={f.password} />}
        error={f.error ?? undefined}
      />
      <CampoContrasena
        etiqueta="Escríbela otra vez"
        autoComplete="new-password"
        value={f.otra}
        onChange={f.onOtra}
        testId="reset-password-2"
        visible={f.visible}
        onVisible={f.setVisible}
        pista={<PistaIgual password={f.password} otra={f.otra} />}
      />
    </>
  );
}

export function ResetForm({ token }: { readonly token: string }) {
  const f = useReset(token);
  return (
    <TarjetaAcceso icono={<LockKeyhole size={24} />} titulo="Crea una contraseña nueva">
      <form onSubmit={f.submit} noValidate className={form}>
        <Campos f={f} />
        <p className={`${nota} ${hueco}`} role="note">
          <LogOut size={18} aria-hidden="true" />
          Se cerrarán tus otras sesiones abiertas.
        </p>
        <Button type="submit" size="lg" full disabled={f.pending}>
          {f.pending ? 'Guardando…' : 'Guardar y entrar'}
        </Button>
      </form>
      <p className={pieTexto}>
        ¿Se venció el enlace?
        <Link className={enlace} href="/login/recuperar">
          Pedir otro enlace
        </Link>
      </p>
    </TarjetaAcceso>
  );
}

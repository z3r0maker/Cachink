'use client';

import { Check, ChevronLeft, LifeBuoy, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Banner, Button, CampoCodigo, MonedaGirando } from '@/components';
import { button } from '@/components/button.css';
import { PROVEEDOR } from '@xangarro/domain';

import { nota, pila } from '../../_publico/publico.css';
import { rutaDeDueno } from '../puertas';
import { destacado, form } from '../recuperar/recuperar.css';
import { TarjetaAcceso } from '../recuperar/tarjeta';
import { useSegundoPaso, type Paso } from './use-segundo-paso';
import * as s from './verificar.css';

type ConCodigo = 'app' | 'recuperacion';

const COPY = {
  app: {
    titulo: 'Escribe tu código',
    bajada: 'Abre tu app de autenticación y escribe el código de 6 dígitos de Xangarro.',
    enviar: 'Verificar y entrar',
    otro: 'Usar un código de recuperación',
  },
  recuperacion: {
    titulo: 'Usa un código de recuperación',
    bajada:
      'Escribe uno de los códigos que guardaste al activar la verificación en dos pasos. Cada uno sirve una sola vez.',
    enviar: 'Entrar con este código',
    otro: 'Usar el código de mi app',
  },
} as const;

function Forma({ p, modo }: { readonly p: Paso; readonly modo: ConCodigo }) {
  return (
    <form onSubmit={p.enviar} noValidate className={`${form} ${pila}`}>
      <CampoCodigo
        modo={modo}
        value={p.codigo}
        onChange={p.escribir}
        error={p.bloqueado ? undefined : (p.error ?? undefined)}
        disabled={p.bloqueado || p.pending}
        autoFocus
        testId="segundo-paso-codigo"
      />
      {p.bloqueado && p.error ? <Banner tone="warning" title={p.error} /> : null}
      <Button type="submit" size="lg" full disabled={p.pending || p.bloqueado}>
        {p.pending ? (
          <>
            <MonedaGirando /> Subiendo la cortina…
          </>
        ) : (
          COPY[modo].enviar
        )}
      </Button>
    </form>
  );
}

/** The other ways out of the step: the other kind of code, help, another account. */
function Salidas({ p, modo }: { readonly p: Paso; readonly modo: ConCodigo }) {
  return (
    <>
      <Button
        variant="secondary"
        full
        onClick={() => p.cambiar(modo === 'app' ? 'recuperacion' : 'app')}
        disabled={p.pending}
        data-testid="segundo-paso-cambiar"
      >
        {COPY[modo].otro}
      </Button>
      <div className={s.ayuda}>
        <span className={s.pregunta}>¿Sin teléfono y sin códigos?</span>
        <Button variant="ghost" onClick={() => p.cambiar('ayuda')} disabled={p.pending}>
          Pedir ayuda
        </Button>
      </div>
      <Link href={rutaDeDueno} className={`${button({ variant: 'ghost' })} ${s.volver}`}>
        <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
        Entrar con otra cuenta
      </Link>
    </>
  );
}

/** Owner decision (2026-11-10): no emailed link turns it off. Support confirms who is asking. */
function Ayuda({ p }: { readonly p: Paso }) {
  return (
    <TarjetaAcceso
      icono={<LifeBuoy size={24} />}
      titulo="Te ayudamos a entrar"
      bajada={
        <>
          Escríbenos a <strong className={destacado}>{PROVEEDOR.correo}</strong> desde el correo de
          tu cuenta. Te pedimos una identificación para confirmar que eres tú y apagamos la
          verificación en dos pasos.
        </>
      }
    >
      <p className={nota} role="note">
        <Check size={18} aria-hidden="true" />
        Mientras tanto tus cajas siguen cobrando.
      </p>
      <a href={`mailto:${PROVEEDOR.correo}`} className={button({ size: 'lg', full: true })}>
        Escribir a soporte
      </a>
      <Button variant="secondary" full onClick={() => p.cambiar('app')}>
        Volver al código
      </Button>
    </TarjetaAcceso>
  );
}

/** Step 2 of 2 (N-83, board SgDesafio): the app code, a recovery code, or a way to ask for help. */
export function SegundoPaso() {
  const p = useSegundoPaso();
  if (p.modo === 'ayuda') return <Ayuda p={p} />;
  const copy = COPY[p.modo];
  return (
    <TarjetaAcceso
      icono={<ShieldCheck size={24} />}
      ceja="Paso 2 de 2"
      titulo={copy.titulo}
      bajada={copy.bajada}
    >
      <Forma p={p} modo={p.modo} />
      <Salidas p={p} modo={p.modo} />
    </TarjetaAcceso>
  );
}

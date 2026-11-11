'use client';

import { ChevronLeft, Clock, Mail } from 'lucide-react';
import Link from 'next/link';

import { Banner, Button, Input, MonedaGirando } from '@/components';
import { button } from '@/components/button.css';
import { MarcoPublico } from '@/app/_publico/marco';
import { ancho, nota, zona } from '@/app/_publico/publico.css';
import { rutaDeDueno } from '@/app/login/puertas';
import { acciones, aparte, destacado, form } from '@/app/login/recuperar/recuperar.css';
import { TarjetaAcceso } from '@/app/login/recuperar/tarjeta';

import { useRevisa, type Revisa } from './use-revisa';

function Bajada({ email, alEntrar }: { readonly email: string; readonly alEntrar: boolean }) {
  const correo = <strong className={destacado}>{email}</strong>;
  return alEntrar ? (
    <>
      Tu contraseña es correcta, pero todavía no confirmas tu correo. Te mandamos un enlace nuevo a{' '}
      {correo}. Ábrelo para entrar.
    </>
  ) : (
    <>
      Te mandamos un enlace a {correo}. Ábrelo para confirmar que el correo es tuyo y abrir tu
      changarro.
    </>
  );
}

function Acciones({ r }: { readonly r: Revisa }) {
  return (
    <div className={acciones}>
      <Button
        variant="secondary"
        onClick={r.reenviar}
        disabled={r.pending || r.enEspera}
        data-testid="revisa-reenviar"
      >
        {r.pending ? (
          <>
            <MonedaGirando /> Mandando…
          </>
        ) : r.enEspera ? (
          'Pide otro en 1 min'
        ) : (
          'Mandar otro enlace'
        )}
      </Button>
      <Button
        variant="secondary"
        onClick={r.editar}
        disabled={r.pending}
        data-testid="revisa-corregir"
      >
        Corregir mi correo
      </Button>
    </div>
  );
}

function Corregir({ r }: { readonly r: Revisa }) {
  return (
    <form onSubmit={r.guardar} noValidate className={form}>
      <Input
        labelText="Tu correo"
        type="email"
        autoComplete="email"
        value={r.borrador}
        onChange={(ev) => r.setBorrador(ev.target.value)}
        hintText="Mandamos el enlace al correo nuevo. El anterior deja de servir."
        data-testid="revisa-correo-nuevo"
      />
      <div className={acciones}>
        <Button variant="secondary" onClick={r.cancelar} disabled={r.pending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={r.pending || !r.borradorValido}
          data-testid="revisa-guardar"
        >
          {r.pending ? 'Mandando…' : 'Guardar y mandar enlace'}
        </Button>
      </div>
    </form>
  );
}

/**
 * «Revisa tu correo» (N-83, board SgRevisaCorreo): nothing opens here. The two
 * actions are for the email that did not arrive and the address typed wrong.
 */
export function RevisaCorreo(props: { readonly email: string; readonly alEntrar: boolean }) {
  const r = useRevisa(props.email);
  return (
    <MarcoPublico
      pose={r.aviso?.tono === 'critical' ? 'preocupado' : 'quieto'}
      titulo="Abre tu changarro."
      bajada="Tus ventas, tu caja y tus estados financieros en un solo lugar. Finanzas para emprendedores."
    >
      <div className={`${zona} ${ancho.angosto}`}>
        <TarjetaAcceso
          icono={<Mail size={24} />}
          titulo={props.alEntrar ? 'Falta confirmar tu correo' : 'Revisa tu correo'}
          bajada={<Bajada email={r.email} alEntrar={props.alEntrar} />}
        >
          <p className={nota} role="note">
            <Clock size={18} aria-hidden="true" />
            El enlace dura 24 horas y funciona una sola vez.
          </p>
          {r.aviso === null ? null : <Banner tone={r.aviso.tono} title={r.aviso.texto} />}
          {r.editando ? <Corregir r={r} /> : <Acciones r={r} />}
          <p className={aparte}>¿No llega? Revisa también tu carpeta de spam.</p>
          <Link href={rutaDeDueno} className={button({ variant: 'ghost' })}>
            <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
            {props.alEntrar ? 'Volver a entrar' : 'Ya lo confirmé. Entrar'}
          </Link>
        </TarjetaAcceso>
      </div>
    </MarcoPublico>
  );
}

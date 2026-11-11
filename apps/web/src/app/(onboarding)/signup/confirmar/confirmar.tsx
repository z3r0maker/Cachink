'use client';

import { Check, Clock, MailCheck, MailX } from 'lucide-react';
import Link from 'next/link';

import { Banner, Button, MonedaGirando } from '@/components';
import { button } from '@/components/button.css';
import { MarcoPublico } from '@/app/_publico/marco';
import { ancho, zona } from '@/app/_publico/publico.css';
import { rutaDeDueno } from '@/app/login/puertas';
import { aparte, destacado } from '@/app/login/recuperar/recuperar.css';
import { TarjetaAcceso } from '@/app/login/recuperar/tarjeta';
import type { EnlaceDeConfirmacion } from '@/server/acceso/confirmacion';

import { useConfirmar, type Confirmar } from './use-confirmar';

type Listo = Extract<EnlaceDeConfirmacion, { estado: 'listo' }>;

function PorConfirmar({ c, enlace }: { readonly c: Confirmar; readonly enlace: Listo }) {
  return (
    <TarjetaAcceso
      icono={<MailCheck size={24} />}
      titulo="Confirma tu correo"
      bajada={
        <>
          Con esto confirmas que <strong className={destacado}>{enlace.email}</strong> es tuyo y
          abres <strong className={destacado}>{enlace.negocio}</strong>.
        </>
      }
    >
      {c.error === null ? null : <Banner tone="critical" title={c.error} />}
      <Button
        size="lg"
        full
        onClick={c.confirmar}
        disabled={c.pending}
        data-testid="confirmar-correo"
      >
        {c.pending ? (
          <>
            <MonedaGirando /> Subiendo la cortina…
          </>
        ) : c.error === null ? (
          'Confirmar y abrir mi changarro'
        ) : (
          'Intentar otra vez'
        )}
      </Button>
      <p className={aparte}>
        ¿No creaste esta cuenta? Cierra esta página. Sin confirmar, nadie puede entrar con tu
        correo.
      </p>
    </TarjetaAcceso>
  );
}

function Confirmado({ siguiente }: { readonly siguiente: string }) {
  return (
    <TarjetaAcceso
      icono={<Check size={26} strokeWidth={3} />}
      titulo="Correo confirmado"
      bajada="Tu changarro ya está abierto. Ahora platícanos de tu negocio para dejarlo listo."
    >
      <Link
        href={siguiente}
        className={button({ size: 'lg', full: true })}
        data-testid="confirmado-seguir"
      >
        Seguir
      </Link>
    </TarjetaAcceso>
  );
}

function Vencido({ c, correo }: { readonly c: Confirmar; readonly correo: string }) {
  return (
    <TarjetaAcceso
      icono={<Clock size={24} />}
      titulo="Este enlace ya venció"
      bajada={
        <>
          Los enlaces duran 24 horas. Pide otro y te llega a{' '}
          <strong className={destacado}>{correo}</strong>.
        </>
      }
    >
      {c.reenviado ? (
        <Banner tone="success" title="Listo, revisa tu correo. El enlace nuevo dura 24 horas." />
      ) : null}
      {c.error === null ? null : <Banner tone="warning" title={c.error} />}
      <Button
        size="lg"
        full
        onClick={c.pedirOtro}
        disabled={c.pending || c.reenviado}
        data-testid="confirmar-pedir-otro"
      >
        {c.reenviado ? 'Enlace enviado' : c.pending ? 'Mandando…' : 'Mandar otro enlace'}
      </Button>
    </TarjetaAcceso>
  );
}

/** Spent, or never issued: either way the next step is the sign-in form. */
function SinEnlace({ usado }: { readonly usado: boolean }) {
  return (
    <TarjetaAcceso
      icono={usado ? <MailCheck size={24} /> : <MailX size={24} />}
      titulo={usado ? 'Este enlace ya se usó' : 'Este enlace no sirve'}
      bajada={
        usado
          ? 'Tu correo ya está confirmado. Entra con tu correo y tu contraseña.'
          : 'Puede estar incompleto. Ábrelo otra vez desde tu correo, o entra para pedir otro.'
      }
    >
      <Link href={rutaDeDueno} className={button({ size: 'lg', full: true })}>
        Entrar
      </Link>
    </TarjetaAcceso>
  );
}

function Tarjeta({ c, enlace }: { readonly c: Confirmar; readonly enlace: EnlaceDeConfirmacion }) {
  if (c.siguiente !== null) return <Confirmado siguiente={c.siguiente} />;
  const estado = c.estado ?? enlace.estado;
  if (estado === 'listo' && enlace.estado === 'listo')
    return <PorConfirmar c={c} enlace={enlace} />;
  if (estado === 'vencido') {
    return <Vencido c={c} correo={enlace.estado === 'vencido' ? enlace.correo : 'tu correo'} />;
  }
  return <SinEnlace usado={estado === 'usado'} />;
}

/**
 * The page the emailed link opens (N-83, board SgConfirmar). It shows what the
 * link is; the button is what confirms.
 */
export function ConfirmarCorreo(props: {
  readonly token: string;
  readonly enlace: EnlaceDeConfirmacion;
}) {
  const c = useConfirmar(props.token);
  const pose = c.siguiente !== null ? 'celebrando' : c.error === null ? 'quieto' : 'preocupado';
  return (
    <MarcoPublico
      pose={pose}
      titulo="Abre tu changarro."
      bajada="Tus ventas, tu caja y tus estados financieros en un solo lugar. Finanzas para emprendedores."
    >
      <div className={`${zona} ${ancho.angosto}`}>
        <Tarjeta c={c} enlace={props.enlace} />
      </div>
    </MarcoPublico>
  );
}

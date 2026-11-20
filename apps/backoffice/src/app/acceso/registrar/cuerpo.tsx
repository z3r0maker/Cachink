'use client';

import * as c from '@/components/trastienda/controls.css';
import { CheckIcon, KeyIcon } from '@/components/trastienda/icons';
import { Notice } from '@/components/trastienda/notice';
import { LOGIN_PATH } from '@/server/gate';
import { muted } from '@/styles/ui.css';

import * as r from './registrar.css';

/** What the vale's stub says under the title, per state (board CD-20b). */
export const INTROS: Readonly<Record<Estado['kind'], string>> = {
  revisando: 'Un momento.',
  valido:
    'Este enlace es solo para ti. Tu equipo guardará una llave de acceso y desde ese momento entras con un toque.',
  esperando:
    'Este enlace es solo para ti. Tu equipo guardará una llave de acceso y desde ese momento entras con un toque.',
  'no-creada':
    'Este enlace es solo para ti. Tu equipo guardará una llave de acceso y desde ese momento entras con un toque.',
  fallida:
    'Este enlace es solo para ti. Tu equipo guardará una llave de acceso y desde ese momento entras con un toque.',
  lista: 'Desde ahora entras a la consola con un toque. Este enlace ya no sirve para nada más.',
  vencido: 'Los enlaces para registrar una llave duran 15 minutos.',
  usado: 'Cada enlace registra una sola llave.',
  invalido: 'Lo reemplazó uno más nuevo, o no se copió completo.',
};

/** Every state of board CD-20b, plus «no sirve» and «no se guardó» (round 22, tabs 7 and 8). */
export type Estado =
  | { readonly kind: 'revisando' }
  | {
      readonly kind: 'valido' | 'esperando' | 'no-creada' | 'fallida';
      readonly nombre: string;
      readonly vence: string;
    }
  | { readonly kind: 'lista'; readonly llave: string }
  | { readonly kind: 'vencido' | 'usado' | 'invalido' };

const hora = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

function ParaQuien({ nombre, vence }: { readonly nombre: string; readonly vence: string }) {
  return (
    <div className={r.para}>
      <span className={r.inicial} aria-hidden="true">
        {nombre.slice(0, 1).toUpperCase()}
      </span>
      <span className={r.paraTexto}>
        <strong>{nombre}</strong>
        <span className={r.paraNota}>
          Enlace válido hasta las {hora(vence)} · sirve una sola vez
        </span>
      </span>
    </div>
  );
}

function Entrada({ label }: { readonly label: string }) {
  return (
    <a className={c.secondary} href={LOGIN_PATH}>
      {label}
    </a>
  );
}

function NoSeCreo({ estado }: { readonly estado: Extract<Estado, { nombre: string }> }) {
  if (estado.kind === 'no-creada') {
    return (
      <Notice tone="aviso" title="No se creó ninguna llave.">
        Cerraste la ventana antes de terminar. El enlace sigue sirviendo hasta las{' '}
        {hora(estado.vence)}.
      </Notice>
    );
  }
  if (estado.kind !== 'fallida') return null;
  return (
    <Notice tone="error" title="No se pudo guardar la llave.">
      Intenta otra vez. Si vuelve a pasar, pídele a tu socio un enlace nuevo.
    </Notice>
  );
}

function Crear(props: {
  readonly estado: Extract<Estado, { nombre: string }>;
  readonly onCrear: (nombre: string, vence: string) => void;
}) {
  const { estado } = props;
  const waiting = estado.kind === 'esperando';
  return (
    <>
      <ParaQuien nombre={estado.nombre} vence={estado.vence} />
      <NoSeCreo estado={estado} />
      <button
        className={c.cta}
        type="button"
        disabled={waiting}
        onClick={() => props.onCrear(estado.nombre, estado.vence)}
      >
        <KeyIcon />
        {waiting ? 'Esperando tu llave…' : 'Crear mi llave'}
      </button>
      {waiting ? (
        <p className={c.hint}>
          Tu navegador abre su propia ventana para guardar la llave. Confirma con Face ID, Touch ID
          o el PIN de este equipo.
        </p>
      ) : null}
      <p className={muted}>
        {waiting
          ? 'No cierres esta página hasta que tu equipo termine.'
          : 'Si tu equipo te ofrece guardarla en el llavero o el administrador de contraseñas, acéptalo: así la llave llega a tus otros equipos.'}
      </p>
    </>
  );
}

function Lista({ llave }: { readonly llave: string }) {
  return (
    <>
      <div className={c.notice.ok}>
        <span className={r.listaFila}>
          <CheckIcon />
          <strong>{llave}</strong>
        </span>
      </div>
      <a className={c.cta} href="/">
        Entrar a la consola
      </a>
      <p className={muted}>
        Te conviene tener una segunda llave en otro equipo. La agregas desde Mi acceso, abajo en el
        menú.
      </p>
    </>
  );
}

/** The three dead links: what to do, and the way back to the entrance. */
function Muerto({ kind }: { readonly kind: 'vencido' | 'usado' | 'invalido' }) {
  const notice =
    kind === 'usado' ? (
      <Notice tone="error" title="Si no fuiste tú, avísale a tu socio de inmediato.">
        Puede quitar esa llave y generarte un enlace nuevo. Si fuiste tú, entra con tu llave.
      </Notice>
    ) : kind === 'vencido' ? (
      <Notice tone="aviso" title="Pídele a tu socio un enlace nuevo.">
        Lo genera desde su terminal, y vuelves a abrirlo aquí.
      </Notice>
    ) : (
      <Notice tone="aviso" title="Pídele a tu socio un enlace nuevo." />
    );
  return (
    <>
      {notice}
      <Entrada label="Ir a la entrada" />
      {kind === 'vencido' ? (
        <p className={muted}>El enlace vencido no registró ninguna llave.</p>
      ) : null}
    </>
  );
}

export function Cuerpo(props: {
  readonly estado: Estado;
  readonly onCrear: (nombre: string, vence: string) => void;
}) {
  const { estado } = props;
  if (estado.kind === 'revisando') return null;
  if (estado.kind === 'lista') return <Lista llave={estado.llave} />;
  if ('nombre' in estado) return <Crear estado={estado} onCrear={props.onCrear} />;
  return <Muerto kind={estado.kind} />;
}

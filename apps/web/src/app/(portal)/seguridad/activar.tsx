'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

import { Banner, Button, CampoCodigo, Drawer, Input, MonedaGirando } from '@/components';

import * as p from '../privacidad/privacidad.css';
import { Codigos } from './codigos';
import * as s from './seguridad.css';
import { useActivar, type Activando, type Paso } from './use-activar';

const CEJA: Readonly<Record<Paso, string>> = {
  clave: 'Paso 1 de 3',
  escanear: 'Paso 2 de 3',
  codigos: 'Paso 3 de 3',
};
const SUBTITULO: Readonly<Record<Paso, string>> = {
  clave: 'Confirma que eres tú',
  escanear: 'Conecta tu app de autenticación',
  codigos: 'Guarda tus códigos de recuperación',
};

/** A lock or an outage is the panel's; a wrong password or code belongs to its field. */
function Aviso({ a }: { readonly a: Activando }) {
  if (a.error === null || a.error.campo !== undefined) return null;
  return <Banner tone={a.error.bloqueado ? 'warning' : 'critical'} title={a.error.texto} />;
}

function Clave({ a }: { readonly a: Activando }) {
  return (
    <>
      <p className={p.texto}>Antes de cambiar cómo entras a tu cuenta, escribe tu contraseña.</p>
      <Input
        labelText="Tu contraseña"
        type="password"
        autoComplete="current-password"
        value={a.password}
        onChange={(ev) => a.setPassword(ev.target.value)}
        error={a.error?.campo === 'password' ? a.error.texto : undefined}
        disabled={a.error?.bloqueado === true}
        data-testid="activar-password"
      />
    </>
  );
}

/** The seed as a QR and, for a phone that cannot scan, as a key to type. */
function Semilla({ qr, clave }: { readonly qr: string; readonly clave: string }) {
  const [copiada, setCopiada] = useState(false);
  const copiar = () =>
    void navigator.clipboard.writeText(clave.replaceAll(' ', '')).then(() => setCopiada(true));
  return (
    <div className={s.qrCaja}>
      <img
        className={s.qr}
        src={qr}
        alt="Código QR para tu app de autenticación"
        width={176}
        height={176}
      />
      <div className={s.claveCaja}>
        <span className={p.filaTitulo}>¿No puedes escanear?</span>
        <span className={p.sub}>Escribe esta clave en tu app:</span>
        <code className={s.clave} data-testid="activar-clave">
          {clave}
        </code>
        <Button variant="ghost" icon={<Copy size={16} aria-hidden="true" />} onClick={copiar}>
          {copiada ? 'Clave copiada' : 'Copiar la clave'}
        </Button>
      </div>
    </div>
  );
}

function Escanear({ a }: { readonly a: Activando }) {
  return (
    <>
      <ol className={s.instrucciones}>
        <li>
          Abre tu app de autenticación en el teléfono. Si no tienes, instala Google Authenticator o
          Microsoft Authenticator.
        </li>
        <li>Escanea este código con la app.</li>
        <li>Escribe el código de 6 dígitos que te muestra.</li>
      </ol>
      {a.semilla === null ? null : <Semilla qr={a.semilla.qr} clave={a.semilla.clave} />}
      <CampoCodigo
        modo="app"
        value={a.codigo}
        onChange={a.setCodigo}
        error={a.error?.campo === 'codigo' ? a.error.texto : undefined}
        disabled={a.error?.bloqueado === true || a.pending}
        testId="activar-codigo"
      />
    </>
  );
}

/** «Seguir» on the password, «Activar» on the code. */
function Avanzar({ a }: { readonly a: Activando }) {
  const clave = a.paso === 'clave';
  const vacio = clave ? a.password === '' : a.codigo.trim() === '';
  return (
    <Button
      onClick={clave ? a.confirmarClave : a.activar}
      disabled={a.pending || vacio || a.error?.bloqueado === true}
      data-testid="activar-seguir"
    >
      {a.pending ? (
        <>
          <MonedaGirando /> Verificando…
        </>
      ) : clave ? (
        'Seguir'
      ) : (
        'Activar'
      )}
    </Button>
  );
}

function Acciones(props: {
  readonly a: Activando;
  readonly guardados: boolean;
  readonly cerrar: () => void;
}) {
  const { a } = props;
  if (a.paso === 'codigos') {
    return (
      <Button onClick={props.cerrar} disabled={!props.guardados} data-testid="activar-terminar">
        Terminar
      </Button>
    );
  }
  const clave = a.paso === 'clave';
  return (
    <>
      <Button variant="secondary" onClick={clave ? props.cerrar : a.atras} disabled={a.pending}>
        {clave ? 'Cancelar' : 'Atrás'}
      </Button>
      <Avanzar a={a} />
    </>
  );
}

function Cuerpo(props: {
  readonly a: Activando;
  readonly guardados: boolean;
  readonly onGuardados: (value: boolean) => void;
}) {
  const { a } = props;
  if (a.paso === 'codigos') {
    return (
      <div className={s.panel}>
        <Banner tone="success" title="Listo, tu cuenta ya tiene segundo paso." />
        <Codigos codigos={a.codigos} guardados={props.guardados} onGuardados={props.onGuardados} />
      </div>
    );
  }
  return (
    <div className={s.panel}>
      <Aviso a={a} />
      {a.paso === 'clave' ? <Clave a={a} /> : <Escanear a={a} />}
    </div>
  );
}

/**
 * Turning the second factor on (N-83, board SgActivar), in the side panel
 * every form opens in: the password, the QR with its first code, and the ten
 * recovery codes, shown once.
 */
export function Activar(props: { readonly open: boolean; readonly onClose: () => void }) {
  const a = useActivar();
  const [guardados, setGuardados] = useState(false);
  const cerrar = () => {
    a.reiniciar();
    setGuardados(false);
    props.onClose();
  };
  return (
    <Drawer
      open={props.open}
      onOpenChange={(open) => (open ? undefined : cerrar())}
      heading="Activar la verificación en dos pasos"
      eyebrow={CEJA[a.paso]}
      subtitle={SUBTITULO[a.paso]}
      width={560}
      actions={<Acciones a={a} guardados={guardados} cerrar={cerrar} />}
    >
      <Cuerpo a={a} guardados={guardados} onGuardados={setGuardados} />
    </Drawer>
  );
}

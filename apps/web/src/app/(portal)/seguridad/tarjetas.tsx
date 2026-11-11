import { LockKeyhole, LogIn, Shield, ShieldCheck } from 'lucide-react';

import { Button, Card, Tag } from '@/components';
import { placaTono } from '@/app/_publico/publico.css';
import type { EstadoSeguridad } from '@/server/acceso/seguridad';

import * as p from '../privacidad/privacidad.css';
import { fechaLarga } from '../suscripcion/fecha';
import * as s from './seguridad.css';

const PASOS = [
  [
    'Instala una app de autenticación',
    'Google Authenticator, Microsoft Authenticator o la que ya uses. Son gratis.',
  ],
  ['Escanea un código con tu teléfono', 'Se hace una sola vez y toma un minuto.'],
  ['Guarda tus códigos de recuperación', 'Con ellos entras si pierdes el teléfono.'],
] as const;

/** At or under this many, the page says so (board SgSeguridad, «Quedan pocos códigos»). */
const POCOS = 2;

function ComoFunciona() {
  return (
    <section className={p.tarjeta} aria-labelledby="sg-como">
      <h2 id="sg-como" className={p.ceja}>
        Cómo funciona
      </h2>
      <ol className={s.pasos}>
        {PASOS.map(([titulo, sub], i) => (
          <li key={titulo} className={s.paso}>
            <span className={s.numero} aria-hidden="true">
              {i + 1}
            </span>
            <span className={s.pasoTexto}>
              <span className={p.filaTitulo}>{titulo}</span>
              <span className={p.sub}>{sub}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Off: the one hero of the page, with the one primary action, and how it works. */
export function Apagada({ onActivar }: { readonly onActivar: () => void }) {
  return (
    <>
      <Card emphasis="hero">
        <div className={s.heroe}>
          <span className={placaTono.amarilla} aria-hidden="true">
            <Shield size={24} />
          </span>
          <div className={s.heroeTexto}>
            <div className={s.cejaFila}>
              <span className={p.ceja}>Verificación en dos pasos</span>
              <Tag tone="neutral">Apagada</Tag>
            </div>
            <h2 className={s.titulo2}>Ponle un segundo paso a tu cuenta</h2>
            <p className={p.texto}>
              Además de tu contraseña, te pedimos un código de 6 dígitos que solo tu teléfono
              muestra. Aunque alguien sepa tu contraseña, no entra.
            </p>
          </div>
          <span className={s.accion}>
            <Button size="lg" onClick={onActivar} data-testid="seguridad-activar">
              Activar
            </Button>
          </span>
        </div>
      </Card>
      <ComoFunciona />
    </>
  );
}

export interface EncendidaProps {
  readonly estado: EstadoSeguridad;
  readonly ocupado: boolean;
  readonly onCodigos: () => void;
  readonly onDesactivar: () => void;
}

function Hecho({ desde }: { readonly desde: string | null }) {
  return (
    <Card emphasis="hero">
      <div className={s.heroe}>
        <span className={placaTono.verde} aria-hidden="true">
          <ShieldCheck size={24} />
        </span>
        <div className={s.heroeTexto}>
          <div className={s.cejaFila}>
            <span className={p.ceja}>Verificación en dos pasos</span>
            <Tag tone="success">Encendida</Tag>
          </div>
          <h2 className={s.titulo2}>Tu cuenta tiene segundo paso</h2>
          <p className={p.texto} data-testid="seguridad-desde">
            Desde el {fechaLarga(desde)}. Además de tu contraseña, entras con el código de tu app de
            autenticación.
          </p>
        </div>
      </div>
    </Card>
  );
}

function FilaCodigos(props: {
  readonly quedan: number;
  readonly ocupado: boolean;
  readonly onCodigos: () => void;
}) {
  const pocos = props.quedan <= POCOS;
  return (
    <div className={p.fila}>
      <span className={p.filaTexto}>
        <span className={s.cejaFila}>
          <span className={p.filaTitulo}>Códigos de recuperación</span>
          {pocos ? <Tag tone="warning">Quedan pocos</Tag> : null}
        </span>
        <span className={p.sub} data-testid="seguridad-codigos">
          {pocos
            ? `Te quedan ${props.quedan} de 10. Genera códigos nuevos antes de que se acaben.`
            : `Te quedan ${props.quedan} de 10. Cada uno sirve una sola vez.`}
        </span>
      </span>
      <Button variant="secondary" onClick={props.onCodigos} disabled={props.ocupado}>
        Generar códigos nuevos
      </Button>
    </div>
  );
}

/** On: since when, the recovery codes left, and the way to turn it off. */
export function Encendida({ estado, ocupado, onCodigos, onDesactivar }: EncendidaProps) {
  return (
    <>
      <Hecho desde={estado.desde} />
      <section className={p.tarjeta} aria-labelledby="sg-codigos">
        <h2 id="sg-codigos" className={p.ceja}>
          Tus códigos y tu teléfono
        </h2>
        <FilaCodigos quedan={estado.codigos} ocupado={ocupado} onCodigos={onCodigos} />
        <div className={p.fila}>
          <span className={p.filaTexto}>
            <span className={p.filaTitulo}>Desactivar la verificación en dos pasos</span>
            <span className={p.sub}>
              Tu cuenta vuelve a entrar solo con tu contraseña. Si cambias de teléfono, desactívala
              y actívala de nuevo.
            </span>
          </span>
          <Button variant="danger" onClick={onDesactivar} disabled={ocupado}>
            Desactivar
          </Button>
        </div>
      </section>
    </>
  );
}

/** When the code is asked: the same two moments, in the future tense while it is off. */
export function Cuando({ activa }: { readonly activa: boolean }) {
  return (
    <section className={p.tarjeta} aria-labelledby="sg-cuando">
      <h2 id="sg-cuando" className={p.ceja}>
        {activa ? 'Cuándo te pedimos el código' : 'Cuándo te pediremos el código'}
      </h2>
      <div className={s.filaIcono}>
        <LogIn size={20} aria-hidden="true" />
        <span className={s.pasoTexto}>
          <span className={p.filaTitulo}>Al entrar a tu portal</span>
          <span className={p.sub}>Cada vez que inicias sesión, después de tu contraseña.</span>
        </span>
      </div>
      <div className={s.filaIcono}>
        <LockKeyhole size={20} aria-hidden="true" />
        <span className={s.pasoTexto}>
          <span className={p.filaTitulo}>Antes de cambiar operadores, cajas o tu plan</span>
          <span className={p.sub}>
            Un código vale por 15 minutos, para que no lo escribas en cada cambio.
          </span>
        </span>
      </div>
    </section>
  );
}

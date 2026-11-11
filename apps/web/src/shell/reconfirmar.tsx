'use client';

import { Clock } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { Banner, Button, CampoCodigo, ConfirmDialog } from '@/components';
import { confirmarIdentidad } from '@/server/actions/segundo-paso';

import * as s from './reconfirmar.css';

/**
 * The re-ask (N-83, ADR-142 §8; board SgReconfirmar). With the second factor
 * on, a change to operators, cajas or billing is refused by its server action
 * with `reconfirmar: true` until a code is typed. `protegido` is how a screen
 * answers that: it runs the action, opens this dialog on that refusal, and
 * runs the action again once the code is accepted. `null` means the person
 * closed the dialog: nothing was changed and there is nothing to report.
 *
 * The dialog is a convenience, never the control: the action checks again.
 */
interface ConBandera {
  readonly ok: boolean;
  readonly reconfirmar?: true;
}

interface Reconfirmar {
  /** `contexto` says what is about to change: «Vas a cambiar tu plan.» */
  protegido<T extends ConBandera>(accion: () => Promise<T>, contexto?: string): Promise<T | null>;
}

interface Pedido {
  readonly contexto: string | undefined;
  readonly resolver: (confirmado: boolean) => void;
}

/** Outside the provider (a story, a test) the action simply runs. */
const Contexto = createContext<Reconfirmar>({ protegido: (accion) => accion() });

export const useReconfirmar = (): Reconfirmar => useContext(Contexto);

const PIDE = {
  app: 'Escribe el código de tu app de autenticación.',
  recuperacion: 'Escribe uno de tus códigos de recuperación. Cada uno sirve una sola vez.',
} as const;

const SIN_RESPUESTA = 'No pudimos revisar tu código. Intenta otra vez.';

/**
 * `pending` is plain state, not a transition: the dialog is open inside the
 * calling screen's own pending action, and React holds every transition's
 * flag until all of them settle, so the field would stay closed after a wrong
 * code and nobody could type the right one.
 */
function useCodigo(onListo: () => void) {
  const [modo, setModo] = useState<'app' | 'recuperacion'>('app');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [pending, setPending] = useState(false);
  const confirmar = async () => {
    if (pending) return;
    setPending(true);
    const r = await confirmarIdentidad(codigo).catch(() => null);
    setPending(false);
    if (r?.ok) return onListo();
    setBloqueado(r?.bloqueado === true);
    setError(r?.message ?? SIN_RESPUESTA);
  };
  const cambiar = () => {
    setModo((m) => (m === 'app' ? 'recuperacion' : 'app'));
    setCodigo('');
    if (!bloqueado) setError(null);
  };
  return { modo, codigo, setCodigo, error, bloqueado, pending, confirmar, cambiar };
}

type Codigo = ReturnType<typeof useCodigo>;

/** The code, the 15-minute note and the way to a recovery code. Enter confirms. */
function Cuerpo({ c }: { readonly c: Codigo }) {
  return (
    <form
      className={s.cuerpo}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void c.confirmar();
      }}
    >
      <CampoCodigo
        modo={c.modo}
        value={c.codigo}
        onChange={c.setCodigo}
        error={c.bloqueado ? undefined : (c.error ?? undefined)}
        disabled={c.bloqueado || c.pending}
        autoFocus
        testId="reconfirmar-codigo"
      />
      {c.bloqueado && c.error ? <Banner tone="warning" title={c.error} /> : null}
      <p className={s.nota} role="note">
        <Clock size={18} aria-hidden="true" />
        No te lo volvemos a pedir durante 15 minutos.
      </p>
      <Button variant="ghost" onClick={c.cambiar} disabled={c.pending}>
        {c.modo === 'app' ? 'Usar un código de recuperación' : 'Usar el código de mi app'}
      </Button>
    </form>
  );
}

function Dialogo(props: { readonly pedido: Pedido; readonly cerrar: (ok: boolean) => void }) {
  const c = useCodigo(() => props.cerrar(true));
  const pide = PIDE[c.modo];
  const { contexto } = props.pedido;
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (open ? undefined : props.cerrar(false))}
      title="Confirma que eres tú"
      body={contexto === undefined ? pide : `${contexto} ${pide}`}
      confirmLabel={c.pending ? 'Verificando…' : 'Confirmar'}
      confirmDisabled={c.pending || c.bloqueado || c.codigo.trim() === ''}
      onConfirm={() => void c.confirmar()}
      don={false}
    >
      <Cuerpo c={c} />
    </ConfirmDialog>
  );
}

export function ReconfirmarProvider({ children }: { readonly children: React.ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const pedir = useCallback(
    (contexto: string | undefined) =>
      new Promise<boolean>((resolver) => setPedido({ contexto, resolver })),
    [],
  );
  const value = useMemo<Reconfirmar>(
    () => ({
      async protegido(accion, contexto) {
        const primero = await accion();
        if (primero.ok || primero.reconfirmar !== true) return primero;
        return (await pedir(contexto)) ? accion() : null;
      },
    }),
    [pedir],
  );
  const cerrar = (confirmado: boolean) => {
    pedido?.resolver(confirmado);
    setPedido(null);
  };
  return (
    <Contexto.Provider value={value}>
      {children}
      {pedido === null ? null : <Dialogo pedido={pedido} cerrar={cerrar} />}
    </Contexto.Provider>
  );
}

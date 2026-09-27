'use client';

import { useState, type ReactNode } from 'react';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import type { OperadorPara } from '../runtime/protocol';
import * as a from './acceso.css';
import { Marco } from './marco';
import { useNip, useTecladoFisico, type EstadoNip, type Tecla } from './nip-estado';
import * as n from './nip.css';

const CHECK = 'M20 6 9 17l-5-5';
const BORRAR =
  'M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm2 4 6 6m0-6-6 6';
const FLECHA = 'M5 12h14m-7-7 7 7-7 7';
const DIGITOS: readonly Tecla[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** The operator's avatar tint, from the domain's colour name. */
const TINTE: Readonly<Record<string, string>> = {
  blue: colors.blueSoft,
  cyan: colors.blueSoft,
  green: colors.greenSoft,
  red: colors.redSoft,
  purple: colors.purpleSoft,
  slate: colors.gray100,
};

export function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

function Operadores(p: { readonly operadores: readonly OperadorPara[]; readonly s: EstadoNip }) {
  return (
    <div role="radiogroup" aria-label="Quién va a cobrar" className={n.operadores}>
      {p.operadores.map((o) => {
        const on = p.s.elegido?.id === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={n.operador}
            data-testid="acceso-operador"
            onClick={() => p.s.elegir(o)}
          >
            <span
              className={n.avatar}
              style={{
                background: on ? colors.yellow : (TINTE[o.avatarColor] ?? colors.peachSoft),
              }}
            >
              {iniciales(o.nombre)}
            </span>
            <span className={n.nombre}>{o.nombre}</span>
            {on ? <Icon path={CHECK} size={22} strokeWidth={2.6} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function Puntos(p: { readonly llenos: number }) {
  return (
    <div
      role="img"
      aria-label={`${p.llenos} de 4 números escritos`}
      className={n.dots}
      data-testid="nip-cajas"
      data-llenos={p.llenos}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={n.dot} data-lleno={i < p.llenos} />
      ))}
    </div>
  );
}

function Teclado(p: { readonly s: EstadoNip }) {
  const sinElegir = p.s.elegido === null;
  const listo = !sinElegir && p.s.nip.length === 4 && !p.s.ocupado;
  const tecla = (k: Tecla, extra?: string, label?: string) => (
    <button
      key={k}
      type="button"
      className={extra ? `${n.key} ${extra}` : n.key}
      disabled={k === '→' ? !listo : sinElegir}
      aria-label={label}
      data-testid={`nip-tecla-${k}`}
      onClick={() => p.s.press(k)}
    >
      {k === '⌫' ? <Icon path={BORRAR} size={22} strokeWidth={2} /> : null}
      {k === '⌫' ? 'Borrar' : k === '→' ? 'Entrar' : k}
      {k === '→' ? <Icon path={FLECHA} size={20} strokeWidth={2.4} /> : null}
    </button>
  );
  return (
    <div className={n.keypad}>
      {DIGITOS.map((k) => tecla(k))}
      {tecla('⌫', n.keyBorrar, 'Borrar el último número')}
      {tecla('0')}
      {tecla('→', n.keyEntrar, listo ? undefined : 'Entrar, falta completar el NIP')}
    </div>
  );
}

/** «NIP incorrecto. Te quedan N intentos.» */
function Intentos(p: { readonly fallidos: number; readonly restantes: number }): ReactNode {
  if (p.fallidos <= 0 || p.restantes <= 0) return null;
  return (
    <p className={a.fallo} role="alert" data-testid="nip-error">
      NIP incorrecto. Te quedan {p.restantes} intento{p.restantes === 1 ? '' : 's'}.
    </p>
  );
}

function Olvide(): ReactNode {
  const [ver, setVer] = useState(false);
  return (
    <div className={n.ayuda}>
      <button
        type="button"
        className={n.ayudaBoton}
        aria-expanded={ver}
        onClick={() => setVer((v) => !v)}
      >
        ¿Olvidaste tu NIP? Pídele al dueño que te lo cambie.
      </button>
      {ver ? (
        <span className={n.ayudaTexto}>
          El dueño lo cambia desde su portal, en Equipo y nómina. Nadie más puede cambiarlo desde la
          caja.
        </span>
      ) : null}
    </div>
  );
}

function BloqueNip(p: { readonly s: EstadoNip }): ReactNode {
  const s = p.s;
  return (
    <div className={a.heading}>
      <div className={n.nipHead}>
        <span className={n.nipLabel}>Tu NIP</span>
        <span className={n.nipHint}>
          {s.elegido === null ? 'Primero elige quién eres' : 'Cuatro números'}
        </span>
      </div>
      <Puntos llenos={s.nip.length} />
      <Intentos fallidos={s.fallidos} restantes={s.restantes} />
      <Teclado s={s} />
    </div>
  );
}

/** «Jueves 14 de mayo», for the eyebrow. */
function hoy(): string {
  const d = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return d.replace(',', '');
}

/**
 * ¿Quién va a cobrar? (OpAcceso): the operator and their four-digit NIP on
 * one screen, verified on the device against the hash the bootstrap carried.
 */
export function Nip(p: {
  readonly operadores: readonly OperadorPara[];
  readonly onAutenticado: (userId: string) => void;
  readonly verificar: (nombre: string, nip: string) => Promise<{ success: boolean }>;
  readonly caja: string;
  /** The screen's own error line (loading the operators, opening the turno). */
  readonly pie?: ReactNode;
}) {
  const s = useNip(p);
  useTecladoFisico(s.press);
  const primero = s.elegido?.nombre.trim().split(/\s+/)[0];
  return (
    <Marco
      pose="hola"
      mensaje={
        primero
          ? `¡Qué onda, ${primero}! Pon tu NIP y a vender.`
          : '¡Qué onda! ¿Quién va a cobrar hoy?'
      }
      chip={p.caja}
      chipSub="conectada"
      vinculada
    >
      <div className={a.heading}>
        <span className={a.eyebrow}>{hoy()}</span>
        <h1 className={a.titulo}>¿Quién va a cobrar?</h1>
        <Operadores operadores={p.operadores} s={s} />
      </div>
      <BloqueNip s={s} />
      <Olvide />
      {p.pie}
    </Marco>
  );
}

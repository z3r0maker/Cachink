import type { StaticImageData } from 'next/image';

import ayuda from './poses/ayuda.webp';
import caminando from './poses/caminando.webp';
import celebrando from './poses/celebrando.webp';
import contando from './poses/contando.webp';
import hola from './poses/hola.webp';
import pensando from './poses/pensando.webp';
import preocupado from './poses/preocupado.webp';
import parpadeo from './poses/quieto-parpadeo.webp';
import quieto from './poses/quieto.webp';
import senalando from './poses/senalando.webp';
import * as s from './don.css';

/**
 * Don Cuentas, full body (ADR-107). One pose per moment: `hola` greets,
 * `quieto` listens (and blinks), `pensando` gives tips, `contando` is the
 * loader, `celebrando` marks a win, `preocupado` flags a problem,
 * `senalando` points the way, `ayuda` is the help centre, `caminando` walks
 * the owner through a guide or a multi-step flow.
 */
export type DonPose =
  | 'hola'
  | 'quieto'
  | 'pensando'
  | 'contando'
  | 'celebrando'
  | 'preocupado'
  | 'senalando'
  | 'ayuda'
  | 'caminando';

export type DonMotion = keyof typeof s.motion;

const POSES: Readonly<Record<DonPose, StaticImageData>> = {
  hola,
  quieto,
  pensando,
  contando,
  celebrando,
  preocupado,
  senalando,
  ayuda,
  caminando,
};

const MOTION: Readonly<Record<DonPose, DonMotion>> = {
  hola: 'saluda',
  quieto: 'respira',
  pensando: 'respira',
  contando: 'asiente',
  celebrando: 'salta',
  preocupado: 'duda',
  senalando: 'respira',
  ayuda: 'respira',
  caminando: 'camina',
};

export interface DonProps {
  readonly pose: DonPose;
  /** Square size in px. */
  readonly size?: number;
  readonly motion?: DonMotion;
  /** Empty by default: his words always travel as text beside him. */
  readonly alt?: string;
}

export function Don({ pose, size = 160, motion, alt = '' }: DonProps) {
  const box = { width: size, height: size };
  return (
    <span className={`${s.figure} ${s.motion[motion ?? MOTION[pose]]}`} style={box}>
      <img className={s.image} src={POSES[pose].src} alt={alt} width={size} height={size} />
      {pose === 'quieto' ? (
        <img className={s.blink} src={parpadeo.src} alt="" width={size} height={size} />
      ) : null}
    </span>
  );
}

export interface DonDiceProps {
  readonly pose: DonPose;
  readonly children: React.ReactNode;
  readonly size?: number;
  readonly tone?: keyof typeof s.bubbleTone;
}

/** Don Cuentas saying one thing about the screen he is on. */
export function DonDice({ pose, children, size = 96, tone = 'amarillo' }: DonDiceProps) {
  return (
    <div className={s.dice} role="note" aria-label="Nota de Don Cuentas">
      <Don pose={pose} size={size} />
      <p className={`${s.bubble} ${s.bubbleTone[tone]}`}>
        <svg className={s.tail} viewBox="0 0 20 32" width={20} height={32} aria-hidden="true">
          <path d="M20 1 L2 16 L20 31 Z" className={s.tailFill[tone]} />
          <path d="M20 1 L2 16 L20 31" className={s.tailLine} />
        </svg>
        {children}
      </p>
    </div>
  );
}

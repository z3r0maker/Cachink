'use client';

import Image from 'next/image';

import { useCortina } from './cortina';
import donAbierto from './don-cuentas-abierto.webp';
import donGancho from './don-cuentas-gancho.webp';
import * as d from './escena-don.css';
import * as c from './escena-cortina.css';
import { Toldo } from './escena-toldo';

const LAMINAS = 13;

/** The shutter itself: slats, the painted «CERRADO», the padlock and the handle. */
function Cortina() {
  const { golpes } = useCortina();
  return (
    <div className={c.cortina}>
      <div key={golpes} className={c.laminas}>
        {Array.from({ length: LAMINAS }, (_, i) => (
          <span key={i} className={c.lamina} />
        ))}
        <span className={c.cerrado}>CERRADO</span>
        <span className={c.candado}>
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
            <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <span className={c.jaladera} />
      </div>
    </div>
  );
}

/**
 * «Tu changarro»: the storefront on the login's panel. Decorative from end to
 * end (`aria-hidden`): everything it acts out, the form says in words.
 */
export function Fachada() {
  return (
    <div className={c.fachada} aria-hidden="true">
      <div className={c.letrero}>
        <span className={c.letreroNombre}>TU CHANGARRO</span>
        <span className={c.foco}>ABIERTO</span>
      </div>
      <Toldo className={c.toldo} />
      <div className={c.hueco}>
        <Image
          className={c.interior}
          src="/hero-taqueria.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 50vw"
        />
        <Cortina />
      </div>
      <div className={d.don}>
        <Image className={d.jalando} src={donGancho} alt="" sizes="250px" priority />
        <Image className={d.saludando} src={donAbierto} alt="" sizes="250px" />
      </div>
    </div>
  );
}

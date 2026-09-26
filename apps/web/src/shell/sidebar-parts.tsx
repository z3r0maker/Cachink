import Link from 'next/link';

import ayuda from '@/components/don/poses/ayuda.webp';
import quieto from '@/components/don/poses/quieto.webp';
import { AVISO_INTEGRAL_URL } from '@/legal/aviso-simplificado';

import { Icon } from './icon';
import type { NavItem } from './nav-items';
import * as c from './sidebar-cards.css';
import * as s from './sidebar.css';

/** Setup progress for the sidebar card; null once every required step is done. */
export interface Pasos {
  readonly done: number;
  readonly total: number;
}

/** Don Cuentas's head in a coin-sized circle, in place of a nav icon. */
function Face() {
  return (
    <span className={c.face} aria-hidden="true">
      <img className={c.faceImg} src={quieto.src} alt="" width={40} height={40} />
    </span>
  );
}

export function NavLink(p: {
  readonly item: NavItem;
  readonly active: boolean;
  readonly badge?: number;
}) {
  const { item } = p;
  const n = p.badge ?? 0;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={n > 0 ? `${item.label}, ${n} pendientes` : undefined}
      className={s.navItem}
      aria-current={p.active ? 'page' : undefined}
    >
      {item.avatar ? <Face /> : <Icon path={item.icon} />}
      <span className={s.navLabel}>{item.label}</span>
      {n > 0 ? (
        <span className={s.badge} aria-hidden="true">
          {n}
        </span>
      ) : null}
    </Link>
  );
}

/** A progress ring: the done share of the circle, in black over gray. */
function Ring({ done, total }: Pasos) {
  const circ = 2 * Math.PI * 16;
  const filled = total === 0 ? 0 : (done / total) * circ;
  return (
    <svg className={c.ring} viewBox="0 0 40 40" width={40} height={40} aria-hidden="true">
      <circle
        cx={20}
        cy={20}
        r={16}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={5}
      />
      <circle
        cx={20}
        cy={20}
        r={16}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

export function PasosCard({ pasos }: { readonly pasos: Pasos }) {
  const faltan = pasos.total - pasos.done;
  return (
    <Link href="/como-empiezo" className={c.pasosCard}>
      <Ring done={pasos.done} total={pasos.total} />
      <span>
        <span className={c.cardTitle}>Primeros pasos</span>
        <span className={c.cardSub}>
          {pasos.done} de {pasos.total} · {faltan === 1 ? 'te falta 1' : `te faltan ${faltan}`}
        </span>
      </span>
    </Link>
  );
}

/** Help, one tap away from every screen (N-08), and the aviso de privacidad (N-34). */
export function AyudaFooter() {
  return (
    <>
      <Link href="/ayuda" className={c.ayudaCard}>
        <img className={c.ayudaImg} src={ayuda.src} alt="" width={40} height={40} />
        <span>
          <span className={c.cardTitle}>¿Atorado?</span>
          <span className={c.cardSub}>Te echo la mano</span>
        </span>
      </Link>
      {/* In the 84 px rail the card has no room: Don Cuentas alone, same link. */}
      <Link href="/ayuda" className={c.ayudaRail} aria-label="¿Atorado? Te echo la mano">
        <img className={c.ayudaImg} src={ayuda.src} alt="" width={40} height={40} />
      </Link>
      <a href={AVISO_INTEGRAL_URL} className={c.privacy}>
        Aviso de privacidad
      </a>
    </>
  );
}

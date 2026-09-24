import { useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { NAV_LINKS } from './links.js';
import { LOGIN_URL, signupUrl } from '../landing/planes.js';

const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside the drawer and closes it on Escape. */
function useTrap(ref, onClose) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !ref.current) return undefined;
      const els = Array.from(ref.current.querySelectorAll(FOCUSABLE));
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return undefined;
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ref, onClose]);
}

export function MobileMenu({ onClose, triggerRef }) {
  const ref = useRef(null);
  useEffect(() => {
    document.body.classList.add('menu-open');
    ref.current?.querySelector('button')?.focus();
    const trigger = triggerRef?.current;
    return () => {
      document.body.classList.remove('menu-open');
      trigger?.focus();
    };
  }, [triggerRef]);
  useTrap(ref, onClose);
  return (
    <div ref={ref} className="menu" role="dialog" aria-modal="true" aria-label="Menú">
      <button type="button" className="nav-menu menu-close" aria-label="Cerrar menú" onClick={onClose}>
        <Icon name="close" size={22} />
      </button>
      <nav aria-label="Menú principal" className="menu-links">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={onClose}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="menu-actions">
        <a className="xbtn xbtn-dark" href={signupUrl('xangarrito')}>
          Crear cuenta gratis
        </a>
        <a className="xbtn xbtn-white" href={LOGIN_URL}>
          Entrar
        </a>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import { Coin, Icon } from './icons.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { NAV_LINKS } from './links.js';
import { LOGIN_URL, signupUrl } from '../landing/planes.js';

export function Brand({ size = 40, fontSize = 28, light = false }) {
  return (
    <a href="/" aria-label="Xangarro, inicio" className="nav-brand">
      <Coin size={size} className={light ? 'coin-light' : ''} />
      <span className="wm" style={{ fontSize, color: light ? 'var(--white)' : undefined }}>
        Xangarro!
      </span>
    </a>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return (
    <header className="nav">
      <div className="xh-wrap nav-row">
        <Brand />
        <nav aria-label="Principal" className="nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="nav-login" href={LOGIN_URL}>
          Entrar
        </a>
        <a className="xbtn xbtn-dark xbtn-sm nav-cta" href={signupUrl('xangarrito')}>
          Crear cuenta gratis
        </a>
        <button
          ref={triggerRef}
          type="button"
          className="nav-menu"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" size={22} />
        </button>
      </div>
      {open ? <MobileMenu onClose={() => setOpen(false)} triggerRef={triggerRef} /> : null}
    </header>
  );
}

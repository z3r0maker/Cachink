/**
 * Sections.jsx — Above-fold components only: Nav + MobileMenu + Hero.
 *
 * Below-fold sections (ParaQuienEs, ComoFunciona, Recorrido, Precios,
 * ContactoFooter) live in landing/sections/ and are lazy-loaded by App.jsx.
 */
import { useState, useEffect, useRef } from 'react';
import { LandingPhoneFrame } from './PhoneScreens.jsx';
import { AnimatedOperativo } from './AnimatedHero.jsx';
import { Parallax } from './Motion.jsx';
import { useViewport } from './Viewport.jsx';
import { TONE_COPY, Eyebrow, HardBtn, HardCard, StoreBadge } from './copy.jsx';
import { signupUrl } from './planes.js';

/* ─────────────── MOBILE MENU ─────────────── */
function MobileMenu({ links, onClose, triggerRef }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('menu-open');
    const closeBtn = drawerRef.current?.querySelector('button[data-close]');
    if (closeBtn) closeBtn.focus();
    return () => {
      document.body.classList.remove('menu-open');
      if (triggerRef?.current) triggerRef.current.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.disabled);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(13,13,13,0.55)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        id="mobile-menu-drawer"
        style={{
          background: 'var(--white)',
          borderBottom: '2.5px solid var(--black)',
          padding: '20px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--gray-600)',
            }}
          >
            Menú
          </span>
          <button
            data-close
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{
              background: 'transparent',
              border: '2px solid var(--black)',
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 900,
              fontFamily: 'var(--font-sans)',
              boxShadow: '2px 2px 0 var(--black)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ✕
          </button>
        </div>
        {links.map(([href, label]) => (
          <a
            key={href}
            href={href}
            onClick={onClose}
            style={{
              display: 'block',
              padding: '15px 0',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--black)',
              textDecoration: 'none',
              borderBottom: '2px solid var(--gray-200)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {label}
          </a>
        ))}
        <div style={{ marginTop: 20 }}>
          <HardBtn size="lg" href={signupUrl('xangarrito')}>
            Crear cuenta gratis →
          </HardBtn>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── NAV ─────────────── */
export function Nav() {
  const { isMobile } = useViewport();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const links = [
    ['#por-que', 'Por qué Xangarro'],
    ['#como', 'Cómo funciona'],
    ['#recorrido', 'Recorrido'],
    ['#precios', 'Precios'],
    ['#contacto', 'Contacto'],
  ];
  return (
    <nav
      style={{
        position: 'relative',
        zIndex: 40,
        background: 'var(--white)',
        borderBottom: '2.5px solid var(--black)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: `14px clamp(20px, 5vw, 28px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <a
          href="#top"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {/* Explicit dimensions prevent CLS while image loads */}
          <img
            src="/assets/apple-touch-icon.png"
            alt="Xangarro!"
            width={isMobile ? 40 : 52}
            height={isMobile ? 40 : 52}
            style={{ width: isMobile ? 40 : 52, height: isMobile ? 40 : 52 }}
          />
        </a>

        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', gap: 28, justifyContent: 'center' }}>
            {links.map(([h, l]) => (
              <a
                key={h}
                href={h}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--black)',
                  textDecoration: 'none',
                  letterSpacing: '-0.005em',
                }}
              >
                {l}
              </a>
            ))}
          </div>
        )}

        <div
          style={{
            flex: isMobile ? 1 : 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <HardBtn size="sm" href={signupUrl('xangarrito')}>
            Crear cuenta
          </HardBtn>
          {isMobile && (
            <button
              ref={hamburgerRef}
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu-drawer"
              style={{
                background: 'var(--white)',
                border: '2px solid var(--black)',
                borderRadius: 10,
                width: 44,
                height: 44,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: '3px 3px 0 var(--black)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 2,
                  background: 'var(--black)',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
              <span
                style={{
                  width: 18,
                  height: 2,
                  background: 'var(--black)',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
              <span
                style={{
                  width: 12,
                  height: 2,
                  background: 'var(--black)',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <MobileMenu
          links={links}
          onClose={() => setMenuOpen(false)}
          triggerRef={hamburgerRef}
        />
      )}
    </nav>
  );
}

/* ─────────────── HERO ─────────────── */
export function Hero({ tone, yellowIntensity }) {
  const c = TONE_COPY[tone];
  const { isMobile, isTablet } = useViewport();

  const heroBg = yellowIntensity === 'low' ? 'var(--offwhite)' : 'var(--yellow)';
  const sparkles = yellowIntensity !== 'low';

  return (
    <section
      id="top"
      style={{
        background: heroBg,
        color: 'var(--black)',
        borderBottom: '2.5px solid var(--black)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {sparkles && !isMobile && (
        <>
          <svg
            style={{ position: 'absolute', top: 60, left: '6%' }}
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="var(--black)"
          >
            <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" />
          </svg>
          <svg
            style={{ position: 'absolute', top: 180, left: '2%' }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="var(--black)"
          >
            <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" />
          </svg>
          <svg
            style={{ position: 'absolute', bottom: 80, right: '6%' }}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="var(--black)"
          >
            <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" />
          </svg>
        </>
      )}
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: `clamp(40px, 8vw, 64px) clamp(20px, 5vw, 28px) clamp(44px, 8vw, 72px)`,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          gap: isMobile ? 28 : 48,
          alignItems: 'center',
        }}
      >
        <div>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h1
            style={{
              margin: '14px 0 16px',
              fontWeight: 900,
              fontSize: isMobile ? 'clamp(38px, 11vw, 52px)' : tone === 'playful' ? 88 : 76,
              lineHeight: 0.95,
              letterSpacing: '-0.045em',
              color: 'var(--black)',
            }}
          >
            {c.h1a}
            <br />
            {c.h1b}
          </h1>
          <p
            style={{
              fontSize: isMobile ? 16 : 19,
              fontWeight: 500,
              color: 'var(--ink)',
              maxWidth: 540,
              lineHeight: 1.45,
              margin: '0 0 28px',
            }}
          >
            {c.sub}
          </p>

          <HardCard variant="white" padding={18} style={{ maxWidth: isMobile ? 'none' : 520 }}>
            <Eyebrow>Crea tu cuenta hoy</Eyebrow>
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 10,
                marginTop: 12,
              }}
            >
              <HardBtn size="sm" variant="dark" href={signupUrl('xangarrito')}>
                {c.cta1}
              </HardBtn>
              <HardBtn size="sm" variant="white" href="#precios">
                Ver precios
              </HardBtn>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              <StoreBadge platform="ios" />
              <StoreBadge platform="android" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--gray-400)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Web hoy · Apps próximamente
              </span>
            </div>
          </HardCard>
        </div>

        {!isMobile && (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Parallax strength={0.25}>
              <div style={{ transform: 'rotate(-3deg)' }}>
                <LandingPhoneFrame scale={isTablet ? 0.8 : 1}>
                  <AnimatedOperativo />
                </LandingPhoneFrame>
              </div>
            </Parallax>
          </div>
        )}
      </div>
    </section>
  );
}

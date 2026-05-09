import { useState, useEffect, useRef } from 'react'
import { LandingPhoneFrame, OperativoStatic, DirectorStatic, NuevaVentaStatic } from './PhoneScreens.jsx'
import { AnimatedOperativo } from './AnimatedHero.jsx'
import { Reveal, Parallax, TiltCard, Wiggle, SpinCoin, useMotionOn } from './Motion.jsx'
import { useViewport } from './Viewport.jsx'

/* ─────────────── Copy decks for the 3 tones ─────────────── */
const TONE_COPY = {
  punchy: {
    eyebrow: '¡CACHINK! · FINANZAS CLARAS',
    h1a: 'Tu caja, clara.',
    h1b: 'Cada día.',
    sub: 'Registra ventas y egresos en 3 segundos. Ve lo que ganas hoy, sin hojas de Excel ni contadores.',
    cta1: 'Entrar a la lista',
    cta2: 'Ver cómo funciona',
    why: [
      { t: 'Tres segundos por venta', d: 'Abres, anotas, listo. Sin menús anidados.' },
      { t: 'Offline siempre', d: 'Aunque se caiga el internet, tu caja no para.' },
      { t: 'Sin suscripciones infinitas', d: 'Un plan gratis generoso, un plan pro honesto.' },
    ],
    howTitle: 'Así funciona',
    how: [
      { n: '01', t: 'Capturas',   d: 'Cada venta o egreso del día. Tarda menos que abrir WhatsApp.' },
      { n: '02', t: 'Ves',        d: 'Ventas de hoy, del mes, efectivo en caja. Actualizado al instante.' },
      { n: '03', t: 'Decides',    d: 'KPIs para dueños, estados financieros para tu contador.' },
    ],
  },
  educational: {
    eyebrow: 'CACHINK · CONTROL FINANCIERO PARA NEGOCIOS PEQUEÑOS',
    h1a: 'Deja de adivinar',
    h1b: 'cuánto ganaste hoy.',
    sub: 'Cachink es una app mexicana pensada para dueños de negocios pequeños. Registras lo que entra y lo que sale, y ella te dice — en español y en pesos — cómo va tu negocio de verdad.',
    cta1: 'Quiero probarla cuando salga',
    cta2: 'Conocer los módulos',
    why: [
      { t: 'Pensada en español, para México', d: 'IVA, NIF, CFDI, MXN. No traducimos software gringo.' },
      { t: 'Tu información es tuya', d: 'Los datos viven en tu dispositivo. La nube es opcional.' },
      { t: 'Tan simple como una libreta', d: 'Si sabes anotar en una libreta, sabes usar Cachink.' },
    ],
    howTitle: 'Así te ayuda, paso a paso',
    how: [
      { n: '01', t: 'Registras cada movimiento', d: 'Ventas, egresos, inventario. En segundos, sin fórmulas.' },
      { n: '02', t: 'Cachink hace las cuentas', d: 'Corte del día, utilidad del mes, cuentas por cobrar — automático.' },
      { n: '03', t: 'Compartes con tu contador', d: 'Exporta estados financieros en el formato que él necesita.' },
    ],
  },
  playful: {
    eyebrow: '¡CACHINK! · EL SONIDO DE QUE TU NEGOCIO VA BIEN',
    h1a: '¡Cachink!',
    h1b: 'Sonó otra venta.',
    sub: 'La app más honesta para llevar la caja de tu negocio. Sin Excel, sin drama, sin inglés de software caro.',
    cta1: 'Avísame cuando salga',
    cta2: 'Ver la demo',
    why: [
      { t: 'Rápida como la caja registradora', d: 'Un toque. ¡Cachink! Venta guardada.' },
      { t: 'Clara como un recibo', d: 'Lo que entró, lo que salió, lo que queda. Sin adornos.' },
      { t: 'Para quienes hacen, no para quienes reportan', d: 'Menos botones. Más negocio.' },
    ],
    howTitle: '¿Cómo se usa? Así',
    how: [
      { n: '01', t: 'Anotas',   d: 'La venta de la doña, el café del cliente fiel, la compra del día.' },
      { n: '02', t: 'Miras',    d: 'Ventas hoy, utilidad del mes, qué te deben. De un vistazo.' },
      { n: '03', t: 'Creces',   d: 'Con números reales — no con la corazonada de siempre.' },
    ],
  },
};

/* ─────────────── Small bits ─────────────── */
const Eyebrow = ({ children, light }) => (
  <div style={{
    display: 'inline-block',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: light ? '#D6D6D2' : 'var(--gray-600)',
  }}>{children}</div>
);

const HardBtn = ({ children, variant = 'primary', size = 'lg', onClick, href }) => {
  const V = {
    primary: { bg: 'var(--yellow)', fg: 'var(--black)' },
    dark:    { bg: 'var(--black)',  fg: 'var(--white)' },
    ghost:   { bg: 'transparent',    fg: 'var(--black)' },
    white:   { bg: 'var(--white)',   fg: 'var(--black)' },
  }[variant];
  const S = size === 'lg' ? { h: 54, px: 22, fs: 14 } : { h: 44, px: 18, fs: 12 };
  const [p, setP] = useState(false);
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href}
      onMouseDown={() => setP(true)}
      onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)}
      onTouchStart={() => setP(true)}
      onTouchEnd={() => setP(false)}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: V.bg, color: V.fg,
        border: '2px solid var(--black)', borderRadius: 12,
        height: S.h, padding: `0 ${S.px}px`, fontSize: S.fs,
        fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
        fontFamily: 'var(--font-sans)', cursor: 'pointer', userSelect: 'none',
        boxShadow: p ? '1px 1px 0 var(--black)' : '4px 4px 0 var(--black)',
        transform: p ? 'translate(3px,3px)' : 'none',
        transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
        textDecoration: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}>{children}</Tag>
  );
};

const HardCard = ({ children, variant = 'white', padding = 24, style }) => {
  const BG = { white: 'var(--white)', yellow: 'var(--yellow)', black: 'var(--black)', offwhite: 'var(--offwhite)' }[variant];
  return (
    <div style={{
      background: BG,
      border: `${variant === 'black' ? 2.5 : 2}px solid var(--black)`,
      borderRadius: 18,
      boxShadow: variant === 'black' ? '6px 6px 0 var(--black)' : '5px 5px 0 var(--black)',
      padding, ...style,
    }}>{children}</div>
  );
};

/* ─────────────── MOBILE MENU ─────────────── */
function MobileMenu({ links, onClose, onWaitlist, triggerRef }) {
  const drawerRef = useRef(null);

  // Lock body scroll and manage focus lifecycle
  useEffect(() => {
    document.body.classList.add('menu-open');

    // Focus the close button when menu opens
    const closeBtn = drawerRef.current?.querySelector('button[data-close]');
    if (closeBtn) closeBtn.focus();

    // Return focus to hamburger trigger when menu unmounts
    return () => {
      document.body.classList.remove('menu-open');
      if (triggerRef?.current) triggerRef.current.focus();
    };
  }, []);

  // Focus trap + Escape key
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(drawer.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.disabled);
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
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
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(13,13,13,0.55)',
        display: 'flex', flexDirection: 'column',
      }}
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        style={{
          background: 'var(--white)',
          borderBottom: '2.5px solid var(--black)',
          padding: '20px 24px 28px',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-600)' }}>Menú</span>
          <button
            data-close
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{
              background: 'transparent', border: '2px solid var(--black)', borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-sans)',
              boxShadow: '2px 2px 0 var(--black)', WebkitTapHighlightColor: 'transparent',
            }}
          >✕</button>
        </div>
        {links.map(([href, label]) => (
          <a key={href} href={href} onClick={onClose} style={{
            display: 'block', padding: '15px 0',
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--black)',
            textDecoration: 'none', borderBottom: '2px solid var(--gray-200)',
            WebkitTapHighlightColor: 'transparent',
          }}>{label}</a>
        ))}
        <div style={{ marginTop: 20 }}>
          <HardBtn size="lg" onClick={() => { onClose(); onWaitlist && onWaitlist(); }}>Unirme a la lista →</HardBtn>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── NAV ─────────────── */
function Nav({ onWaitlist }) {
  const { isMobile } = useViewport();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const links = [
    ['#por-que', 'Por qué Cachink'],
    ['#como', 'Cómo funciona'],
    ['#recorrido', 'Recorrido'],
    ['#precios', 'Precios'],
    ['#contacto', 'Contacto'],
  ];
  return (
    <nav style={{
      position: 'relative', zIndex: 40,
      background: 'var(--white)', borderBottom: '2.5px solid var(--black)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: `14px clamp(20px, 5vw, 28px)`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <img src="/assets/apple-touch-icon.png" alt="Cachink" style={{ height: isMobile ? 40 : 52 }} />
        </a>

        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', gap: 28, justifyContent: 'center' }}>
            {links.map(([h, l]) => (
              <a key={h} href={h} style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', textDecoration: 'none', letterSpacing: '-0.005em' }}>{l}</a>
            ))}
          </div>
        )}

        <div style={{ flex: isMobile ? 1 : 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <HardBtn size="sm" onClick={onWaitlist}>Lista de espera</HardBtn>
          {isMobile && (
            <button
              ref={hamburgerRef}
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu-drawer"
              style={{
                background: 'var(--white)', border: '2px solid var(--black)', borderRadius: 10,
                width: 44, height: 44, cursor: 'pointer', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: '3px 3px 0 var(--black)', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ width: 18, height: 2, background: 'var(--black)', borderRadius: 1, display: 'block' }} />
              <span style={{ width: 18, height: 2, background: 'var(--black)', borderRadius: 1, display: 'block' }} />
              <span style={{ width: 12, height: 2, background: 'var(--black)', borderRadius: 1, display: 'block' }} />
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <MobileMenu links={links} onClose={() => setMenuOpen(false)} onWaitlist={onWaitlist} triggerRef={hamburgerRef} />
      )}
    </nav>
  );
}

/* ─────────────── HERO ─────────────── */
function Hero({ tone, yellowIntensity, onSubmitEmail }) {
  const c = TONE_COPY[tone];
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const { isMobile, isTablet } = useViewport();

  async function handleWaitlist(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    const endpoint = typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_WAITLIST_ENDPOINT
      : null;
    if (!endpoint) {
      // No endpoint configured — show success so UX is testable in dev
      setSent(true);
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
    } catch (err) {
      setFormError('Algo salió mal. Intenta de nuevo.');
      console.error('[Cachink waitlist]', err);
    } finally {
      setLoading(false);
    }
  }

  const heroBg = yellowIntensity === 'low' ? 'var(--offwhite)' : 'var(--yellow)';
  const sparkles = yellowIntensity !== 'low';

  return (
    <section id="top" style={{
      background: heroBg, color: 'var(--black)',
      borderBottom: '2.5px solid var(--black)',
      position: 'relative', overflow: 'hidden',
    }}>
      {sparkles && !isMobile && (
        <>
          <svg style={{ position: 'absolute', top: 60, left: '6%' }} width="28" height="28" viewBox="0 0 24 24" fill="var(--black)"><path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" /></svg>
          <svg style={{ position: 'absolute', top: 180, left: '2%' }} width="16" height="16" viewBox="0 0 24 24" fill="var(--black)"><path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" /></svg>
          <svg style={{ position: 'absolute', bottom: 80, right: '6%' }} width="22" height="22" viewBox="0 0 24 24" fill="var(--black)"><path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z" /></svg>
        </>
      )}
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: `clamp(40px, 8vw, 64px) clamp(20px, 5vw, 28px) clamp(44px, 8vw, 72px)`,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
        gap: isMobile ? 28 : 48,
        alignItems: 'center',
      }}>
        <div>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h1 style={{
            margin: '14px 0 16px', fontWeight: 900,
            fontSize: isMobile ? 'clamp(38px, 11vw, 52px)' : (tone === 'playful' ? 88 : 76),
            lineHeight: 0.95, letterSpacing: '-0.045em',
            color: 'var(--black)',
          }}>
            {c.h1a}<br />{c.h1b}
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 19, fontWeight: 500, color: 'var(--ink)', maxWidth: 540, lineHeight: 1.45, margin: '0 0 28px' }}>{c.sub}</p>

          <HardCard variant="white" padding={18} style={{ maxWidth: isMobile ? 'none' : 520 }}>
            <Eyebrow>Próximamente · Únete a la lista</Eyebrow>
            {sent ? (
              <div style={{ marginTop: 10, padding: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-soft)', border: '2px solid var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--green)' }}>✓</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--black)' }}>¡Estás en la lista!</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }}>Te avisamos el día del lanzamiento.</div>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleWaitlist}
                  style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8, marginTop: 10 }}>
                  <input
                    value={email} onChange={e => { setEmail(e.target.value); setFormError(null); }}
                    type="email" required placeholder="tu@correo.com"
                    disabled={loading}
                    aria-label="Tu correo electrónico"
                    style={{
                      flex: 1, border: `2px solid ${formError ? 'var(--red)' : 'var(--black)'}`, borderRadius: 12,
                      padding: '12px 14px', fontSize: 15, fontFamily: 'var(--font-sans)',
                      fontWeight: 500, color: 'var(--ink)', background: 'var(--white)', outline: 'none',
                      opacity: loading ? 0.6 : 1,
                    }} />
                  <HardBtn size="sm" variant="dark" disabled={loading}>
                    {loading ? 'Enviando…' : c.cta1}
                  </HardBtn>
                </form>
                {formError && (
                  <div role="alert" style={{ marginTop: 6, fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
                    {formError}
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <StoreBadge platform="ios" />
              <StoreBadge platform="android" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Verano 2026</span>
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

/* ─────────────── Store badge (grayed) ─────────────── */
function StoreBadge({ platform }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'var(--gray-100)', color: 'var(--gray-400)',
      border: '2px dashed var(--gray-400)', borderRadius: 12,
      padding: '8px 12px', opacity: 0.8,
    }}>
      <div style={{ fontSize: 16, fontWeight: 900 }}>{platform === 'ios' ? '' : '▶'}</div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Próximamente en</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-600)' }}>{platform === 'ios' ? 'App Store' : 'Google Play'}</span>
      </div>
    </div>
  );
}

/* ─────────────── POR QUÉ / audience card ─────────────── */

/* Custom neobrutalist SVG icons for audience cards */
const IconBakery = () => (
  <svg viewBox="0 0 56 56" width="40" height="40" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* croissant body */}
    <path d="M6 34 C 6 22, 16 12, 28 12 C 40 12, 50 22, 50 34 C 50 38, 46 40, 42 38 L 36 36 L 28 38 L 20 36 L 14 38 C 10 40, 6 38, 6 34 Z" fill="var(--yellow)" />
    {/* flaky lines */}
    <path d="M14 28 L 20 32" />
    <path d="M22 22 L 26 30" />
    <path d="M30 20 L 32 30" />
    <path d="M38 22 L 36 30" />
    <path d="M44 28 L 40 32" />
    {/* steam */}
    <path d="M20 8 C 20 6, 22 6, 22 4" stroke="var(--gray-600)" strokeWidth="2" />
    <path d="M28 6 C 28 4, 30 4, 30 2" stroke="var(--gray-600)" strokeWidth="2" />
    <path d="M36 8 C 36 6, 38 6, 38 4" stroke="var(--gray-600)" strokeWidth="2" />
  </svg>
);

const IconShop = () => (
  <svg viewBox="0 0 56 56" width="40" height="40" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* awning */}
    <path d="M6 14 L 50 14 L 46 22 L 10 22 Z" fill="var(--yellow)" />
    <path d="M16 14 L 14 22 M 26 14 L 26 22 M 36 14 L 38 22" />
    {/* storefront body */}
    <path d="M10 22 L 10 48 L 46 48 L 46 22" fill="var(--yellow)" />
    {/* door */}
    <rect x="22" y="32" width="12" height="16" fill="var(--yellow)" />
    <circle cx="31" cy="40" r="0.9" fill="var(--black)" stroke="none" />
    {/* windows */}
    <rect x="13" y="26" width="7" height="6" fill="var(--yellow)" />
    <rect x="36" y="26" width="7" height="6" fill="var(--yellow)" />
    {/* ground */}
    <path d="M4 48 L 52 48" />
    {/* sign */}
    <rect x="23" y="18" width="10" height="3" fill="var(--black)" stroke="none" />
  </svg>
);

const IconToolbox = () => (
  <svg viewBox="0 0 56 56" width="40" height="40" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* car body — cabin roof */}
    <path d="M14 26 L 18 16 L 38 16 L 42 26" fill="var(--yellow)" />
    {/* windows split */}
    <path d="M28 16 L 28 26" />
    {/* main body */}
    <path d="M6 36 L 8 26 L 48 26 L 50 36 L 50 40 L 6 40 Z" fill="var(--yellow)" />
    {/* headlight + taillight */}
    <rect x="46" y="30" width="3" height="3" fill="var(--black)" stroke="none" />
    <rect x="7" y="30" width="3" height="3" fill="var(--black)" stroke="none" />
    {/* wheels */}
    <circle cx="16" cy="42" r="5" fill="var(--yellow)" />
    <circle cx="16" cy="42" r="1.8" fill="var(--black)" stroke="none" />
    <circle cx="40" cy="42" r="5" fill="var(--yellow)" />
    <circle cx="40" cy="42" r="1.8" fill="var(--black)" stroke="none" />
    {/* wrench detail above (service mark) */}
    <path d="M32 10 L 38 4" strokeWidth="2" />
    <circle cx="31" cy="11" r="2" fill="var(--yellow)" strokeWidth="2" />
  </svg>
);

function ParaQuienEs({ tone }) {
  const c = TONE_COPY[tone];
  const { isMobile } = useViewport();
  return (
    <section id="por-que" style={{ background: 'var(--offwhite)', borderBottom: '2.5px solid var(--black)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(48px, 8vw, 80px) clamp(20px, 5vw, 28px)` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 40, alignItems: 'end', marginBottom: 44 }}>
          <div>
            <Eyebrow>Para quién es Cachink</Eyebrow>
            <h2 style={{ margin: '10px 0 0', fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--black)', textWrap: 'pretty' }}>
              Si llevas la caja en la cabeza o en una libreta — esto es para ti.
            </h2>
          </div>
          <p style={{ fontSize: 17, color: 'var(--ink)', fontWeight: 500, lineHeight: 1.5, margin: 0, maxWidth: 460 }}>
            Cachink está hecho para dueños de negocios pequeños que capturan cada venta a mano. Panaderías, cafés, tiendas de barrio, talleres, consultorios.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { Icon: IconBakery,  t: 'Panaderías y cafés', d: 'Decenas de ventas chicas al día. Cachink te lleva el corte del día sin hacer cuentas a mano.' },
            { Icon: IconShop,    t: 'Tiendas de barrio',  d: 'Efectivo, fiado, transferencia. Registras cómo te pagaron y ves qué te deben.' },
            { Icon: IconToolbox, t: 'Talleres y servicios', d: 'Trabajos chicos con insumos. Cachink separa ingresos de costos y te da la utilidad real.' },
          ].map((x, i) => (
            <Reveal key={i} delay={i * 120} from="up">
              <TiltCard max={5} lift={6}>
                <HardCard padding={24}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: 'var(--yellow)', border: '2.5px solid var(--black)',
                    boxShadow: '3px 3px 0 var(--black)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 18,
                  }}>
                    <x.Icon />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--black)', marginBottom: 8 }}>{x.t}</div>
                  <div style={{ fontSize: 14, color: 'var(--gray-600)', fontWeight: 500, lineHeight: 1.5 }}>{x.d}</div>
                </HardCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}>
          {c.why.map((x, i) => (
            <Reveal key={i} delay={i * 100} from="up">
              <TiltCard max={5} lift={5}>
                <HardCard padding={24} variant={i === 1 ? 'yellow' : 'white'}>
                  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--black)', marginBottom: 6 }}>{x.t}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, lineHeight: 1.5 }}>{x.d}</div>
                </HardCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── CÓMO FUNCIONA ─────────────── */
function ComoFunciona({ tone, darkSection }) {
  const c = TONE_COPY[tone];
  const onDark = darkSection;
  const { isMobile } = useViewport();
  return (
    <section id="como" style={{
      background: onDark ? 'var(--black)' : 'var(--yellow)',
      color: onDark ? 'var(--white)' : 'var(--black)',
      borderBottom: '2.5px solid var(--black)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(48px, 8vw, 80px) clamp(20px, 5vw, 28px)` }}>
        <Eyebrow light={onDark}>{c.howTitle}</Eyebrow>
        <h2 style={{ margin: '10px 0 44px', fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: onDark ? 'var(--white)' : 'var(--black)' }}>
          Tres pasos. Todos los días.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          {c.how.map((s, i) => (
            <Reveal key={i} delay={i * 140} from="up">
              <TiltCard max={7} lift={8}>
                <div style={{
                  background: onDark ? 'var(--white)' : 'var(--white)',
                  border: '2px solid var(--black)',
                  borderRadius: 18, boxShadow: '5px 5px 0 var(--black)',
                  padding: 28, position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', top: -18, left: 20,
                    background: 'var(--black)', color: 'var(--yellow)',
                    fontWeight: 900, fontSize: 16, letterSpacing: '0.08em',
                    padding: '6px 12px', borderRadius: 10, border: '2px solid var(--black)',
                  }}>{s.n}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)', marginTop: 8, marginBottom: 10 }}>{s.t}</div>
                  <div style={{ fontSize: 15, color: 'var(--gray-600)', fontWeight: 500, lineHeight: 1.55 }}>{s.d}</div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── RECORRIDO (feature tour) ─────────────── */
function Recorrido() {
  const { isMobile, isTablet } = useViewport();
  const rows = [
    {
      Phone: OperativoStatic,
      eyebrow: '01 · OPERATIVO',
      title: 'Tu caja, cada mañana.',
      desc: 'Abres la app. Ves lo que vendiste ayer, lo que te queda en caja, y lo que está pendiente de capturar. Todo en una pantalla.',
      bullets: ['Ventas del día en grande', 'Movimientos con método de pago', 'Corte de día de un toque'],
      bg: 'var(--offwhite)',
      rotate: -2,
    },
    {
      Phone: NuevaVentaStatic,
      eyebrow: '02 · CAPTURA',
      title: 'Una venta, en tres segundos.',
      desc: 'Monto, concepto, método de pago. Nada más. El formulario se adapta al giro de tu negocio — si solo cobras efectivo, ni ves las otras opciones.',
      bullets: ['Monto en MXN, sin calcular IVA a mano', 'Métodos en botones grandes', 'Guarda offline; sincroniza después'],
      bg: 'var(--white)',
      rotate: 3,
    },
    {
      Phone: DirectorStatic,
      eyebrow: '03 · DIRECTOR',
      title: 'El panel que tu contador entiende.',
      desc: 'Si no eres quien captura, tienes un panel aparte. Utilidad del mes, cuentas por cobrar, liquidez, meta. Lectura solamente — no rompes nada.',
      bullets: ['KPIs financieros al vuelo', 'CxC con días de vencimiento', 'Estados financieros exportables'],
      bg: 'var(--offwhite)',
      rotate: -3,
    },
  ];
  return (
    <section id="recorrido" style={{ borderBottom: '2.5px solid var(--black)' }}>
      <div style={{ background: 'var(--white)', borderBottom: '2.5px solid var(--black)', padding: `clamp(44px, 8vw, 72px) clamp(20px, 5vw, 28px)` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Eyebrow>Recorrido</Eyebrow>
          <h2 style={{ margin: '10px 0 0', fontSize: isMobile ? 'clamp(26px, 8vw, 40px)' : 56, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: 'var(--black)', textWrap: 'pretty', maxWidth: 820 }}>
            Un recorrido por las tres pantallas que usarás todos los días.
          </h2>
        </div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ background: r.bg, borderBottom: '2.5px solid var(--black)', padding: `clamp(44px, 8vw, 80px) clamp(20px, 5vw, 28px)` }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : (i % 2 === 0 ? '1fr 1.1fr' : '1.1fr 1fr'),
            gap: isMobile ? 32 : 60, alignItems: 'center',
          }}>
            <div style={{ order: isMobile ? 1 : (i % 2 === 0 ? 1 : 2) }}>
              <Reveal from={i % 2 === 0 ? 'right' : 'left'} distance={32}>
              <Eyebrow>{r.eyebrow}</Eyebrow>
              <h3 style={{ margin: '10px 0 14px', fontSize: isMobile ? 'clamp(22px, 7vw, 34px)' : 44, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.02, color: 'var(--black)' }}>{r.title}</h3>
              <p style={{ fontSize: isMobile ? 15 : 18, color: 'var(--ink)', fontWeight: 500, lineHeight: 1.5, margin: '0 0 22px', maxWidth: 520 }}>{r.desc}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {r.bullets.map((b, j) => (
                  <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, fontWeight: 600, color: 'var(--black)' }}>
                    <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 8, background: 'var(--yellow)', border: '2px solid var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>✓</div>
                    {b}
                  </li>
                ))}
              </ul>
              </Reveal>
            </div>
            {!isMobile && (
              <div style={{ order: i % 2 === 0 ? 2 : 1, display: 'flex', justifyContent: 'center' }}>
                <Parallax strength={0.3}>
                  <Reveal from={i % 2 === 0 ? 'left' : 'right'} distance={40}>
                    <TiltCard max={8} lift={10}>
                      <div style={{ transform: `rotate(${r.rotate}deg)` }}>
                        <LandingPhoneFrame scale={isTablet ? 0.78 : 1}>
                          <r.Phone />
                        </LandingPhoneFrame>
                      </div>
                    </TiltCard>
                  </Reveal>
                </Parallax>
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─────────────── PRECIOS ─────────────── */
function Precios() {
  const { isMobile } = useViewport();
  const tiers = [
    { name: 'Gratis', price: '$0', cad: '/ para siempre', features: ['Ventas + egresos ilimitados', '1 dispositivo', 'Corte de día', 'Exportar a CSV'], variant: 'white', cta: 'Empezar gratis' },
    { name: 'Pro', price: '$149', cad: '/ mes MXN', features: ['Todo lo de Gratis', 'Multi-dispositivo sincronizado', 'Panel Director', 'Estados financieros NIF', 'Soporte por WhatsApp'], variant: 'yellow', cta: 'Probar Pro', featured: true },
    { name: 'Contador', price: '$299', cad: '/ mes MXN', features: ['Todo lo de Pro', 'Hasta 10 negocios', 'Exportación fiscal', 'Multi-usuario con permisos'], variant: 'white', cta: 'Hablar con ventas' },
  ];
  return (
    <section id="precios" style={{ background: 'var(--offwhite)', borderBottom: '2.5px solid var(--black)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(48px, 8vw, 80px) clamp(20px, 5vw, 28px)` }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Eyebrow>Precios · honestos</Eyebrow>
          <h2 style={{ margin: '10px 0 10px', fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--black)' }}>Sin trucos. Sin letra chica.</h2>
          <p style={{ fontSize: 16, color: 'var(--gray-600)', fontWeight: 500, margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            Precios preliminares para el lanzamiento. Los suscriptores de la lista de espera tendrán 3 meses gratis en cualquier plan.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
          {tiers.map((t, i) => (
            <Reveal key={i} delay={i * 120} from="up">
            <TiltCard max={5} lift={t.featured ? 12 : 6}>
            <div style={{
              background: t.variant === 'yellow' ? 'var(--yellow)' : 'var(--white)',
              border: '2.5px solid var(--black)', borderRadius: 20,
              boxShadow: t.featured ? '8px 8px 0 var(--black)' : '5px 5px 0 var(--black)',
              padding: 28, position: 'relative',
              transform: (!isMobile && t.featured) ? 'translateY(-8px)' : 'none',
            }}>
              {t.featured && (
                <div style={{ position: 'absolute', top: -14, right: 20, background: 'var(--black)', color: 'var(--yellow)', fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recomendado</div>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-600)' }}>{t.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--black)', fontVariantNumeric: 'tabular-nums' }}>{t.price}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-600)' }}>{t.cad}</div>
              </div>
              <ul style={{ margin: '18px 0 22px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--black)', fontWeight: 600 }}>
                    <div style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 6, background: 'var(--white)', border: '2px solid var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>✓</div>
                    {f}
                  </li>
                ))}
              </ul>
              <HardBtn size="sm" variant={t.featured ? 'dark' : 'white'}>{t.cta}</HardBtn>
            </div>
            </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── CONTACTO ─────────────── */
function Contacto({ darkSection }) {
  const { isMobile } = useViewport();
  return (
    <section id="contacto" style={{
      background: darkSection ? 'var(--black)' : 'var(--yellow)',
      borderBottom: '2.5px solid var(--black)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(48px, 8vw, 80px) clamp(20px, 5vw, 28px)` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: isMobile ? 32 : 48, alignItems: 'center' }}>
          <div>
            <Eyebrow light={darkSection}>Contacto</Eyebrow>
            <h2 style={{ margin: '10px 0 20px', fontSize: isMobile ? 'clamp(28px, 8vw, 44px)' : 56, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.98, color: darkSection ? 'var(--white)' : 'var(--black)' }}>¿Tienes preguntas? Escríbenos.</h2>
            <p style={{ fontSize: 18, color: darkSection ? '#D6D6D2' : 'var(--ink)', fontWeight: 500, lineHeight: 1.5, margin: '0 0 24px', maxWidth: 520 }}>
              Respondemos el mismo día, en español, como humanos. Nada de chatbots.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Reveal delay={80} from={isMobile ? 'up' : 'right'}>
            <a href="mailto:hola@cachink.mx" style={{ textDecoration: 'none' }}>
              <TiltCard max={6} lift={6}>
              <HardCard padding={20}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--yellow-soft)', border: '2px solid var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✉</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-600)' }}>Correo</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em', marginTop: 2 }}>hola@cachink.mx</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>→</div>
                </div>
              </HardCard>
              </TiltCard>
            </a>
            </Reveal>
            <Reveal delay={220} from={isMobile ? 'up' : 'right'}>
            <a href="https://wa.me/525555555555" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <TiltCard max={6} lift={6}>
              <HardCard padding={20} variant="white" style={{ background: 'var(--green-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--green)', border: '2px solid var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--white)', fontWeight: 900 }}>W</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray-600)' }}>WhatsApp · lun–vie 9–18</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em', marginTop: 2 }}>+52 55 5555 5555</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>→</div>
                </div>
              </HardCard>
              </TiltCard>
            </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FOOTER ─────────────── */

/* Social SVG icons — uniform 22×22 stroked glyphs with brand weight. */
const SocialIG = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const SocialTikTok = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19.5 7.2a6.6 6.6 0 0 1-3.9-1.3v8.6a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.8V2h3a3.6 3.6 0 0 0 3.9 3.6v1.6Z"/>
  </svg>
);
const SocialX = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.4L4.8 21H1.6l7.5-8.6L1.2 3h6.6l4.5 6 5.2-6Zm-1.1 16.2h1.8L7.7 4.7H5.8l10.6 14.5Z"/>
  </svg>
);
const SocialYouTube = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M21.8 7.5a2.5 2.5 0 0 0-1.8-1.8C18.4 5.3 12 5.3 12 5.3s-6.4 0-8 .4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 1.8 12a26 26 0 0 0 .4 4.5 2.5 2.5 0 0 0 1.8 1.8c1.6.4 8 .4 8 .4s6.4 0 8-.4a2.5 2.5 0 0 0 1.8-1.8 26 26 0 0 0 .4-4.5 26 26 0 0 0-.4-4.5ZM10 15.2V8.8L15.5 12 10 15.2Z"/>
  </svg>
);

const SOCIALS = [
  { k: 'ig',  Icon: SocialIG,      label: 'Instagram', href: 'https://instagram.com/cachink' },
  { k: 'tt',  Icon: SocialTikTok,  label: 'TikTok',    href: 'https://tiktok.com/@cachink' },
  { k: 'x',   Icon: SocialX,       label: 'X',         href: 'https://x.com/cachink' },
  { k: 'yt',  Icon: SocialYouTube, label: 'YouTube',   href: 'https://youtube.com/@cachink' },
];

function SocialButton({ Icon, label, href }) {
  const [h, setH] = useState(false);
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 46, height: 46, borderRadius: 12,
        background: h ? 'var(--yellow)' : 'var(--white)',
        border: '2.5px solid var(--black)',
        boxShadow: h ? '2px 2px 0 var(--black)' : '4px 4px 0 var(--black)',
        transform: h ? 'translate(2px, 2px)' : 'none',
        transition: 'transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 140ms, background 140ms',
        color: 'var(--black)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none',
      }}>
      <Icon />
    </a>
  );
}

function Footer() {
  const { isMobile } = useViewport();
  return (
    <footer style={{ background: 'var(--white)', color: 'var(--black)', borderTop: '2.5px solid var(--black)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(36px, 6vw, 48px) clamp(20px, 5vw, 28px) clamp(24px, 4vw, 36px)` }}>
        {/* Top band — logo + tagline + socials */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          gap: isMobile ? 24 : 40, alignItems: 'center',
          paddingBottom: 28,
          borderBottom: '2px solid var(--black)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <img src="assets/logo.png" alt="Cachink" style={{ height: 56, width: 'auto', alignSelf: 'flex-start' }} />
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)', lineHeight: 1.15, maxWidth: 440 }}>
              Finanzas para emprendedores.<br />
              <span style={{ color: 'var(--gray-600)', fontWeight: 700 }}>Hecho en México, con cariño.</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-600)' }}>Síguenos</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {SOCIALS.map(s => <SocialButton key={s.k} {...s} />)}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }}>
            © 2026 Cachink · Todos los derechos reservados
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--yellow)', border: '2px solid var(--black)',
            borderRadius: 10, padding: '6px 10px',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>🇲🇽 Hecho en México</div>
        </div>
      </div>
    </footer>
  );
}

export { Nav, Hero, ParaQuienEs, ComoFunciona, Recorrido, Precios, Contacto, Footer }

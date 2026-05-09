/* Motion utilities for the landing page:
   - <Reveal>        : fades/slides in on scroll
   - <Parallax>      : shifts element on scroll
   - <TiltCard>      : mouse-follow 3D tilt + lift
   - <SpinCoin>      : logo coin that spins on hover
   - <Wiggle>        : wrapper that wiggles on hover
   All honor a `motion` boolean — when false, children render statically. */

import { useState, useEffect, useRef, createContext, useContext } from 'react'

const MotionContext = createContext(true);

function MotionProvider({ enabled, children }) {
  return <MotionContext.Provider value={enabled}>{children}</MotionContext.Provider>;
}
function useMotionOn() { return useContext(MotionContext); }

/* ─────── Scroll reveal ─────── */
function Reveal({ children, delay = 0, from = 'up', distance = 32, style = {} }) {
  const motion = useMotionOn();
  const ref = useRef(null);
  const [shown, setShown] = useState(!motion);

  useEffect(() => {
    if (!motion) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    let done = false;
    let rafId = 0;

    function check() {
      if (done) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh - 40 && r.bottom > 0) {
        done = true;
        setTimeout(() => setShown(true), delay);
        cancelAnimationFrame(rafId);
        return;
      }
      rafId = requestAnimationFrame(check);
    }

    // Kick off a continuous rAF poll — works regardless of how scroll
    // events propagate inside the iframe.
    rafId = requestAnimationFrame(check);

    // Belt-and-suspenders failsafe: reveal after 3s no matter what so
    // nothing is ever stuck invisible.
    const failsafe = setTimeout(() => {
      if (!done) { done = true; setShown(true); cancelAnimationFrame(rafId); }
    }, 3000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(failsafe);
    };
  }, [motion, delay]);

  const fromT = {
    up:    `translateY(${distance}px)`,
    down:  `translateY(-${distance}px)`,
    left:  `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    scale: 'scale(0.92)',
  }[from] || `translateY(${distance}px)`;

  return (
    <div ref={ref} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : fromT,
      transition: 'opacity 700ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      ...style,
    }}>{children}</div>
  );
}

/* ─────── Parallax ─────── */
function Parallax({ children, strength = 0.15, style = {} }) {
  const motion = useMotionOn();
  const ref = useRef(null);
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!motion) return;
    let raf = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const center = rect.top + rect.height / 2;
        const progress = (center - vh / 2) / vh;  // -1..1-ish
        setY(-progress * 60 * strength * 10);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [motion, strength]);

  return (
    <div ref={ref} style={{ transform: motion ? `translate3d(0, ${y}px, 0)` : 'none', willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}

/* ─────── Tilt card ─────── */
function TiltCard({ children, max = 6, lift = 4, style = {} }) {
  const motion = useMotionOn();
  const ref = useRef(null);
  const [t, setT] = useState({ rx: 0, ry: 0, l: 0 });

  function onMove(e) {
    if (!motion) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({ rx: (0.5 - py) * max, ry: (px - 0.5) * max, l: lift });
  }
  function onLeave() { setT({ rx: 0, ry: 0, l: 0 }); }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateY(-${t.l}px)`,
        transition: 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────── Wiggle (button/CTA hover) ─────── */
function Wiggle({ children, style = {} }) {
  const motion = useMotionOn();
  const [hover, setHover] = useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-block',
        animation: motion && hover ? 'wiggle 400ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        ...style,
      }}>{children}
      <style>{`@keyframes wiggle { 0%{transform:rotate(0)} 25%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} 75%{transform:rotate(-1deg)} 100%{transform:rotate(0)} }`}</style>
    </span>
  );
}

/* ─────── Spin coin (decorative) ─────── */
function SpinCoin({ size = 48, style = {} }) {
  const motion = useMotionOn();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%', background: 'var(--yellow)',
      border: '2.5px solid var(--black)', boxShadow: '3px 3px 0 var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 900, color: 'var(--black)',
      animation: motion ? 'coinBob 3s ease-in-out infinite' : 'none',
      cursor: 'default',
      ...style,
    }}
    onMouseEnter={e => { if (motion) e.currentTarget.style.animation = 'coinSpin 500ms cubic-bezier(0.2, 0.8, 0.2, 1), coinBob 3s ease-in-out infinite 500ms'; }}
    >
      $
      <style>{`
        @keyframes coinBob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
        @keyframes coinSpin { from { transform: rotateY(0); } to { transform: rotateY(720deg); } }
      `}</style>
    </div>
  );
}

export { MotionProvider, useMotionOn, Reveal, Parallax, TiltCard, Wiggle, SpinCoin }

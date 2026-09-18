/* AnimatedOperativo — hero phone loop:
   1. Show the Operativo home
   2. Open the "Nueva venta" sheet (slides up)
   3. Type a monto + pick method
   4. Tap GUARDAR — sheet slides down, ¡CACHINK! burst overlay
   5. New row slides into the list, ventasHoy counts up
   6. pause 1.5s, loop
   Times in ms; each step handled by a tiny scheduler. */

import { useState, useEffect, useRef } from 'react'
import { LandingPhoneFrame } from './PhoneScreens.jsx'

const initialRows = [
  { t: 'Pan dulce × 6',     h: '07:42', tg: 'Producto', m: 'Efectivo',      a: 186.00, pos: true },
  { t: 'Pastel cumpleaños', h: '08:15', tg: 'Producto', m: 'Transferencia', a: 780.00, pos: true },
  { t: 'Harina (25kg)',     h: '09:02', tg: 'Insumo',   m: 'Efectivo',      a: -640.00, pos: false },
];

const INCOMING = { t: 'Café mesa 4', h: '10:24', tg: 'Producto', m: 'Efectivo', a: 145.00, pos: true };
const BASE_TOTAL = 966.00;

function MXN(n) { return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function AnimatedTag({ children, variant = 'neutral' }) {
  const V = {
    neutral: ['var(--gray-100)', 'var(--black)'],
    brand:   ['var(--yellow)',   'var(--black)'],
    info:    ['var(--blue-soft)', 'var(--blue)'],
  }[variant];
  return <span style={{
    display: 'inline-flex', alignItems: 'center',
    background: V[0], color: V[1],
    border: '2px solid var(--black)', borderRadius: 20,
    padding: '2px 8px', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
  }}>{children}</span>;
}

function AnimatedOperativo({ motion = true }) {
  // phase: 'idle' | 'opening' | 'typing' | 'saving' | 'cachink' | 'settled'
  const [phase, setPhase] = useState('idle');
  const [typedAmount, setTypedAmount] = useState(0);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(BASE_TOTAL);
  const [totalFlash, setTotalFlash] = useState(false);
  const [loopKey, setLoopKey] = useState(0);
  const tRef = useRef([]);

  function clearTimers() { tRef.current.forEach(clearTimeout); tRef.current = []; }
  function at(ms, fn) { tRef.current.push(setTimeout(fn, ms)); }

  useEffect(() => {
    if (!motion) {
      // Render final state statically
      setPhase('settled');
      setRows([INCOMING, ...initialRows]);
      setTotal(BASE_TOTAL + INCOMING.a);
      setTypedAmount(INCOMING.a);
      return;
    }
    clearTimers();
    // Reset
    setRows(initialRows);
    setTotal(BASE_TOTAL);
    setTypedAmount(0);
    setPhase('idle');

    at(900,  () => setPhase('opening'));
    // Typing digits over 900ms
    at(1800, () => setPhase('typing'));
    const targets = [45, 105, 145];
    targets.forEach((v, i) => at(2000 + i * 260, () => setTypedAmount(v)));
    at(2950, () => setPhase('saving'));
    at(3300, () => setPhase('cachink'));
    at(3300, () => { setRows(r => [INCOMING, ...r]); });
    // Count up total from BASE to BASE+145 over ~700ms
    at(3300, () => {
      const target = BASE_TOTAL + INCOMING.a;
      const duration = 700;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setTotal(BASE_TOTAL + INCOMING.a * eased);
        if (t < 1) requestAnimationFrame(step);
        else setTotal(target);
      }
      requestAnimationFrame(step);
      setTotalFlash(true);
      at(900, () => setTotalFlash(false));
    });
    at(4300, () => setPhase('settled'));
    // loop
    at(6800, () => setLoopKey(k => k + 1));

    return clearTimers;
  }, [loopKey, motion]);

  const sheetOpen = phase === 'opening' || phase === 'typing' || phase === 'saving';
  const showCachink = phase === 'cachink';

  return (
    <div style={{ height: '100%', position: 'relative', background: 'var(--offwhite)', overflow: 'hidden' }}>
      {/* Status bar mimic */}
      <div style={{
        paddingTop: 52, paddingBottom: 10,
        display: 'flex', alignItems: 'center', gap: 10, padding: '52px 14px 10px',
        background: 'var(--white)', borderBottom: '2.5px solid var(--black)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 10,
          border: '2px solid var(--black)', background: 'var(--yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, color: 'var(--black)', fontSize: 11,
        }}>PE</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--black)', letterSpacing: '-0.02em' }}>Cachink</div>
          <div style={{ fontWeight: 600, fontSize: 10, color: 'var(--gray-600)', marginTop: 1 }}>Panadería La Esquina</div>
        </div>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '12px 12px 66px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Hero KPI */}
        <div style={{
          background: 'var(--white)', border: '2px solid var(--black)',
          borderRadius: 14, boxShadow: '4px 4px 0 var(--black)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--yellow)', borderBottom: '2px solid var(--black)' }} />
          <div style={{ padding: '14px 14px 12px', paddingTop: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-600)' }}>Ventas hoy · 24 abr</div>
            <div style={{
              fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em',
              marginTop: 2, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              transition: 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), color 200ms',
              transform: totalFlash ? 'scale(1.08)' : 'scale(1)',
              color: totalFlash ? 'var(--green)' : 'var(--black)',
              transformOrigin: 'left center',
            }}>{MXN(total)}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-600)' }}>Egresos</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>$640.00</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-600)' }}>Neto</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>{MXN(total - 640)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAB-style row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, height: 36, border: '2px solid var(--black)', borderRadius: 10,
            background: phase === 'idle' ? 'var(--yellow)' : 'var(--black)',
            color: phase === 'idle' ? 'var(--black)' : 'var(--white)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            boxShadow: phase === 'idle' ? '4px 4px 0 var(--black)' : '1px 1px 0 var(--black)',
            transform: phase === 'idle' ? 'none' : 'translate(3px, 3px)',
            transition: 'all 150ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}>+ NUEVA VENTA</div>
          <div style={{ flex: 1, height: 36, border: '2px solid var(--black)', borderRadius: 10, background: 'var(--yellow-soft)', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', boxShadow: '3px 3px 0 var(--black)' }}>+ EGRESO</div>
        </div>

        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-600)', marginTop: 4 }}>Movimientos de hoy</div>

        {rows.map((v, i) => {
          const isNew = v === INCOMING;
          return (
            <div key={`${v.t}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', background: 'var(--white)',
              border: '2px solid var(--black)', borderRadius: 14,
              boxShadow: '3px 3px 0 var(--black)',
              animation: isNew ? 'slideInRow 450ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: v.pos ? 'var(--yellow-soft)' : 'var(--red-soft)',
                border: '2px solid var(--black)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900,
              }}>{v.pos ? '$' : '−'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)' }}>{v.t}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                  <AnimatedTag variant="neutral">{v.tg}</AnimatedTag>
                  <AnimatedTag variant={v.m === 'Efectivo' ? 'brand' : 'info'}>{v.m}</AnimatedTag>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '-0.02em', color: v.pos ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                {v.pos ? '+' : ''}{MXN(Math.abs(v.a))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 56, display: 'flex',
        background: 'var(--white)', borderTop: '2.5px solid var(--black)', zIndex: 30,
      }}>
        {[
          { k: 'home', l: 'Inicio', g: '⌂', active: true },
          { k: 'v', l: 'Ventas', g: '$' },
          { k: 'c', l: 'Corte', g: '▤' },
          { k: 'a', l: 'Ajustes', g: '⚙' },
        ].map(it => (
          <div key={it.k} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            background: it.active ? 'var(--yellow)' : 'transparent',
            color: 'var(--black)',
          }}>
            <div style={{ fontSize: 14 }}>{it.g}</div>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{it.l}</span>
          </div>
        ))}
      </div>

      {/* Sheet overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(13, 13, 13, 0.35)',
        opacity: sheetOpen ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 240ms',
        zIndex: 40,
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--white)',
        border: '2.5px solid var(--black)',
        borderRadius: '24px 24px 0 0',
        padding: '20px 18px 30px',
        transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 340ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        zIndex: 41,
        boxShadow: '0 -6px 0 var(--black)',
      }}>
        <div style={{ width: 40, height: 4, background: 'var(--gray-100)', borderRadius: 2, margin: '0 auto 12px' }} />
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)', marginBottom: 14 }}>Nueva venta</div>

        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-600)', marginBottom: 4 }}>Monto</div>
        <div style={{
          background: 'var(--white)', border: '2px solid var(--black)',
          borderRadius: 12, padding: '12px 14px',
          fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--black)',
          fontVariantNumeric: 'tabular-nums', position: 'relative',
        }}>
          ${typedAmount.toFixed(2)}
          {phase === 'typing' && (
            <span style={{
              display: 'inline-block', width: 2, height: 22, background: 'var(--black)',
              verticalAlign: 'middle', marginLeft: 3, animation: 'caretBlink 500ms infinite',
            }} />
          )}
        </div>

        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-600)', margin: '12px 0 4px' }}>Método</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['Efectivo', true], ['Transfer.', false], ['Tarjeta', false]].map(([m, sel], i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '9px 0',
              border: '2px solid var(--black)', borderRadius: 12,
              background: sel ? 'var(--yellow)' : 'var(--white)',
              fontWeight: 700, fontSize: 10, color: 'var(--black)',
              boxShadow: sel ? '3px 3px 0 var(--black)' : 'none',
            }}>{m}</div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 0', border: '2px solid var(--black)', borderRadius: 10, background: 'transparent', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cancelar</div>
          <div style={{
            flex: 1, textAlign: 'center', padding: '10px 0',
            border: '2px solid var(--black)', borderRadius: 10,
            background: 'var(--yellow)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--black)',
            boxShadow: phase === 'saving' ? '1px 1px 0 var(--black)' : '4px 4px 0 var(--black)',
            transform: phase === 'saving' ? 'translate(3px, 3px)' : 'none',
            transition: 'all 120ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}>Guardar</div>
        </div>
      </div>

      {/* ¡CACHINK! burst */}
      {showCachink && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'var(--yellow)',
            border: '3px solid var(--black)',
            borderRadius: 20,
            boxShadow: '6px 6px 0 var(--black)',
            padding: '14px 22px',
            transform: 'rotate(-6deg)',
            animation: 'cachinkPop 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              fontSize: 32, fontWeight: 900,
              letterSpacing: '-0.04em', color: 'var(--black)',
              whiteSpace: 'nowrap',
            }}>¡CACHINK!</div>
          </div>
          {/* burst rays */}
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 3, height: 28,
              background: 'var(--black)',
              transformOrigin: 'center bottom',
              transform: `translate(-50%, -100%) rotate(${i * 45}deg) translateY(-60px)`,
              animation: `rayShoot 600ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
              animationDelay: `${i * 20}ms`,
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideInRow {
          from { transform: translateY(-14px); opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; margin-top: -12px; }
          to { transform: translateY(0); opacity: 1; max-height: 80px; }
        }
        @keyframes caretBlink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes cachinkPop {
          0%   { transform: rotate(-6deg) scale(0.3); opacity: 0; }
          50%  { transform: rotate(-3deg) scale(1.15); opacity: 1; }
          70%  { transform: rotate(-6deg) scale(0.98); }
          100% { transform: rotate(-6deg) scale(1); opacity: 1; }
        }
        @keyframes rayShoot {
          0% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--r, 0deg)) translateY(-10px) scaleY(0.3); }
          60% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -100%) rotate(var(--r, 0deg)) translateY(-90px) scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export { AnimatedOperativo }

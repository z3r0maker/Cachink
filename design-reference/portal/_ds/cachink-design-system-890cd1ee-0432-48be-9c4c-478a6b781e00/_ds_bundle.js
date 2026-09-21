/* @ds-bundle: {"format":4,"namespace":"CachinkDesignSystem_890cd1","components":[{"name":"BottomTabBar","sourcePath":"packages/ui/src/components/BottomTabBar/bottom-tab-bar.tsx"},{"name":"TabItem","sourcePath":"packages/ui/src/components/BottomTabBar/tab-item.tsx"},{"name":"Btn","sourcePath":"packages/ui/src/components/Btn/btn.tsx"},{"name":"Card","sourcePath":"packages/ui/src/components/Card/card.tsx"},{"name":"EmptyState","sourcePath":"packages/ui/src/components/EmptyState/empty-state.tsx"},{"name":"Gauge","sourcePath":"packages/ui/src/components/Gauge/gauge.tsx"},{"name":"Input","sourcePath":"packages/ui/src/components/Input/input.tsx"},{"name":"Kpi","sourcePath":"packages/ui/src/components/Kpi/kpi.tsx"},{"name":"SectionTitle","sourcePath":"packages/ui/src/components/SectionTitle/section-title.tsx"},{"name":"Tag","sourcePath":"packages/ui/src/components/Tag/tag.tsx"},{"name":"TopBar","sourcePath":"packages/ui/src/components/TopBar/top-bar.tsx"}],"sourceHashes":{"landing/AnimatedHero.jsx":"d462c8982a38","landing/Motion.jsx":"961b66189621","landing/PhoneScreens.jsx":"9c07163aef68","landing/Sections.jsx":"3a44e8a363e1","packages/ui/src/components/BottomTabBar/bottom-tab-bar.tsx":"69f544430f10","packages/ui/src/components/BottomTabBar/tab-item.tsx":"a3757cc149b2","packages/ui/src/components/Btn/btn.tsx":"c0a5a7267051","packages/ui/src/components/Card/card.tsx":"6bbaf1ac54fb","packages/ui/src/components/EmptyState/empty-state.tsx":"e8c3b21086e8","packages/ui/src/components/Gauge/gauge.tsx":"a0d0470f50e7","packages/ui/src/components/Input/input.tsx":"de63148663c9","packages/ui/src/components/Kpi/kpi.tsx":"48227ddfa184","packages/ui/src/components/SectionTitle/section-title.tsx":"0e6a6d547150","packages/ui/src/components/Tag/tag.tsx":"da2b6d68a449","packages/ui/src/components/TopBar/top-bar.tsx":"1b7cbfd5c85a","packages/ui/src/theme.ts":"646eee606fae","tweaks-panel.jsx":"82e4c3ddd5ec","ui_kits/cachink_mobile/components/Icons.jsx":"ba6885134112","ui_kits/cachink_mobile/components/Primitives.jsx":"8c8f601d4e62","ui_kits/cachink_mobile/components/Screens.jsx":"26b9ca8f426b","ui_kits/cachink_mobile/components/Shell.jsx":"d0eed93e8e9f","ui_kits/cachink_mobile/ios-frame.jsx":"d67eb3ffe562"},"inlinedExternals":[],"unexposedExports":[{"name":"borders","sourcePath":"packages/ui/src/theme.ts"},{"name":"colors","sourcePath":"packages/ui/src/theme.ts"},{"name":"pressTransform","sourcePath":"packages/ui/src/theme.ts"},{"name":"radii","sourcePath":"packages/ui/src/theme.ts"},{"name":"shadows","sourcePath":"packages/ui/src/theme.ts"},{"name":"theme","sourcePath":"packages/ui/src/theme.ts"},{"name":"typography","sourcePath":"packages/ui/src/theme.ts"}]} */

(() => {

const __ds_ns = (window.CachinkDesignSystem_890cd1 = window.CachinkDesignSystem_890cd1 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// landing/AnimatedHero.jsx
try { (() => {
/* global React, LandingPhoneFrame */
/* AnimatedOperativo — hero phone loop:
   1. Show the Operativo home
   2. Open the "Nueva venta" sheet (slides up)
   3. Type a monto + pick method
   4. Tap GUARDAR — sheet slides down, ¡CACHINK! burst overlay
   5. New row slides into the list, ventasHoy counts up
   6. pause 1.5s, loop
   Times in ms; each step handled by a tiny scheduler. */

const {
  useState,
  useEffect,
  useRef
} = React;
const initialRows = [{
  t: 'Pan dulce × 6',
  h: '07:42',
  tg: 'Producto',
  m: 'Efectivo',
  a: 186.00,
  pos: true
}, {
  t: 'Pastel cumpleaños',
  h: '08:15',
  tg: 'Producto',
  m: 'Transferencia',
  a: 780.00,
  pos: true
}, {
  t: 'Harina (25kg)',
  h: '09:02',
  tg: 'Insumo',
  m: 'Efectivo',
  a: -640.00,
  pos: false
}];
const INCOMING = {
  t: 'Café mesa 4',
  h: '10:24',
  tg: 'Producto',
  m: 'Efectivo',
  a: 145.00,
  pos: true
};
const BASE_TOTAL = 966.00;
function MXN(n) {
  return '$' + n.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function AnimatedTag({
  children,
  variant = 'neutral'
}) {
  const V = {
    neutral: ['var(--gray-100)', 'var(--black)'],
    brand: ['var(--yellow)', 'var(--black)'],
    info: ['var(--blue-soft)', 'var(--blue)']
  }[variant];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: V[0],
      color: V[1],
      border: '2px solid var(--black)',
      borderRadius: 20,
      padding: '2px 8px',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.05em'
    }
  }, children);
}
function AnimatedOperativo({
  motion = true
}) {
  // phase: 'idle' | 'opening' | 'typing' | 'saving' | 'cachink' | 'settled'
  const [phase, setPhase] = useState('idle');
  const [typedAmount, setTypedAmount] = useState(0);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(BASE_TOTAL);
  const [totalFlash, setTotalFlash] = useState(false);
  const [loopKey, setLoopKey] = useState(0);
  const tRef = useRef([]);
  function clearTimers() {
    tRef.current.forEach(clearTimeout);
    tRef.current = [];
  }
  function at(ms, fn) {
    tRef.current.push(setTimeout(fn, ms));
  }
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
    at(900, () => setPhase('opening'));
    // Typing digits over 900ms
    at(1800, () => setPhase('typing'));
    const targets = [45, 105, 145];
    targets.forEach((v, i) => at(2000 + i * 260, () => setTypedAmount(v)));
    at(2950, () => setPhase('saving'));
    at(3300, () => setPhase('cachink'));
    at(3300, () => {
      setRows(r => [INCOMING, ...r]);
    });
    // Count up total from BASE to BASE+145 over ~700ms
    at(3300, () => {
      const target = BASE_TOTAL + INCOMING.a;
      const duration = 700;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setTotal(BASE_TOTAL + INCOMING.a * eased);
        if (t < 1) requestAnimationFrame(step);else setTotal(target);
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      position: 'relative',
      background: 'var(--offwhite)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 52,
      paddingBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '52px 14px 10px',
      background: 'var(--white)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      border: '2px solid var(--black)',
      background: 'var(--yellow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      color: 'var(--black)',
      fontSize: 11
    }
  }, "PE"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 15,
      color: 'var(--black)',
      letterSpacing: '-0.02em'
    }
  }, "Cachink"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 10,
      color: 'var(--gray-600)',
      marginTop: 1
    }
  }, "Panader\xEDa La Esquina")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 12px 66px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 14,
      boxShadow: '4px 4px 0 var(--black)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      background: 'var(--yellow)',
      borderBottom: '2px solid var(--black)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 14px 12px',
      paddingTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)'
    }
  }, "Ventas hoy \xB7 24 abr"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      color: 'var(--black)',
      marginTop: 2,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1,
      transition: 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), color 200ms',
      transform: totalFlash ? 'scale(1.08)' : 'scale(1)',
      color: totalFlash ? 'var(--green)' : 'var(--black)',
      transformOrigin: 'left center'
    }
  }, MXN(total)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)'
    }
  }, "Egresos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 900,
      color: 'var(--red)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "$640.00")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)'
    }
  }, "Neto"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 900,
      color: 'var(--green)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, MXN(total - 640)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 36,
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: phase === 'idle' ? 'var(--yellow)' : 'var(--black)',
      color: phase === 'idle' ? 'var(--black)' : 'var(--white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      boxShadow: phase === 'idle' ? '4px 4px 0 var(--black)' : '1px 1px 0 var(--black)',
      transform: phase === 'idle' ? 'none' : 'translate(3px, 3px)',
      transition: 'all 150ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    }
  }, "+ NUEVA VENTA"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 36,
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'var(--yellow-soft)',
      color: 'var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      boxShadow: '3px 3px 0 var(--black)'
    }
  }, "+ EGRESO")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginTop: 4
    }
  }, "Movimientos de hoy"), rows.map((v, i) => {
    const isNew = v === INCOMING;
    return /*#__PURE__*/React.createElement("div", {
      key: `${v.t}-${i}`,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: 'var(--white)',
        border: '2px solid var(--black)',
        borderRadius: 14,
        boxShadow: '3px 3px 0 var(--black)',
        animation: isNew ? 'slideInRow 450ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 10,
        background: v.pos ? 'var(--yellow-soft)' : 'var(--red-soft)',
        border: '2px solid var(--black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 900
      }
    }, v.pos ? '$' : '−'), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--black)'
      }
    }, v.t), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4,
        marginTop: 3
      }
    }, /*#__PURE__*/React.createElement(AnimatedTag, {
      variant: "neutral"
    }, v.tg), /*#__PURE__*/React.createElement(AnimatedTag, {
      variant: v.m === 'Efectivo' ? 'brand' : 'info'
    }, v.m))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: '-0.02em',
        color: v.pos ? 'var(--green)' : 'var(--red)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, v.pos ? '+' : '', MXN(Math.abs(v.a))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      display: 'flex',
      background: 'var(--white)',
      borderTop: '2.5px solid var(--black)',
      zIndex: 30
    }
  }, [{
    k: 'home',
    l: 'Inicio',
    g: '⌂',
    active: true
  }, {
    k: 'v',
    l: 'Ventas',
    g: '$'
  }, {
    k: 'c',
    l: 'Corte',
    g: '▤'
  }, {
    k: 'a',
    l: 'Ajustes',
    g: '⚙'
  }].map(it => /*#__PURE__*/React.createElement("div", {
    key: it.k,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      background: it.active ? 'var(--yellow)' : 'transparent',
      color: 'var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, it.g), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    }
  }, it.l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(13, 13, 13, 0.35)',
      opacity: sheetOpen ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 240ms',
      zIndex: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--white)',
      border: '2.5px solid var(--black)',
      borderRadius: '24px 24px 0 0',
      padding: '20px 18px 30px',
      transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 340ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      zIndex: 41,
      boxShadow: '0 -6px 0 var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      background: 'var(--gray-100)',
      borderRadius: 2,
      margin: '0 auto 12px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      letterSpacing: '-0.03em',
      color: 'var(--black)',
      marginBottom: 14
    }
  }, "Nueva venta"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginBottom: 4
    }
  }, "Monto"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 12,
      padding: '12px 14px',
      fontSize: 22,
      fontWeight: 900,
      letterSpacing: '-0.03em',
      color: 'var(--black)',
      fontVariantNumeric: 'tabular-nums',
      position: 'relative'
    }
  }, "$", typedAmount.toFixed(2), phase === 'typing' && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 2,
      height: 22,
      background: 'var(--black)',
      verticalAlign: 'middle',
      marginLeft: 3,
      animation: 'caretBlink 500ms infinite'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      margin: '12px 0 4px'
    }
  }, "M\xE9todo"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, [['Efectivo', true], ['Transfer.', false], ['Tarjeta', false]].map(([m, sel], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '9px 0',
      border: '2px solid var(--black)',
      borderRadius: 12,
      background: sel ? 'var(--yellow)' : 'var(--white)',
      fontWeight: 700,
      fontSize: 10,
      color: 'var(--black)',
      boxShadow: sel ? '3px 3px 0 var(--black)' : 'none'
    }
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '10px 0',
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'transparent',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '10px 0',
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'var(--yellow)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--black)',
      boxShadow: phase === 'saving' ? '1px 1px 0 var(--black)' : '4px 4px 0 var(--black)',
      transform: phase === 'saving' ? 'translate(3px, 3px)' : 'none',
      transition: 'all 120ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    }
  }, "Guardar"))), showCachink && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--yellow)',
      border: '3px solid var(--black)',
      borderRadius: 20,
      boxShadow: '6px 6px 0 var(--black)',
      padding: '14px 22px',
      transform: 'rotate(-6deg)',
      animation: 'cachinkPop 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      color: 'var(--black)',
      whiteSpace: 'nowrap'
    }
  }, "\xA1CACHINK!")), [0, 1, 2, 3, 4, 5, 6, 7].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 3,
      height: 28,
      background: 'var(--black)',
      transformOrigin: 'center bottom',
      transform: `translate(-50%, -100%) rotate(${i * 45}deg) translateY(-60px)`,
      animation: `rayShoot 600ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
      animationDelay: `${i * 20}ms`
    }
  }))), /*#__PURE__*/React.createElement("style", null, `
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
      `));
}
Object.assign(window, {
  AnimatedOperativo
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "landing/AnimatedHero.jsx", error: String((e && e.message) || e) }); }

// landing/Motion.jsx
try { (() => {
/* global React */
/* Motion utilities for the landing page:
   - <Reveal>        : fades/slides in on scroll
   - <Parallax>      : shifts element on scroll
   - <TiltCard>      : mouse-follow 3D tilt + lift
   - <SpinCoin>      : logo coin that spins on hover
   - <Wiggle>        : wrapper that wiggles on hover
   All honor a `motion` boolean — when false, children render statically. */

const {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext
} = React;
const MotionContext = createContext(true);
function MotionProvider({
  enabled,
  children
}) {
  return /*#__PURE__*/React.createElement(MotionContext.Provider, {
    value: enabled
  }, children);
}
function useMotionOn() {
  return useContext(MotionContext);
}

/* ─────── Scroll reveal ─────── */
function Reveal({
  children,
  delay = 0,
  from = 'up',
  distance = 32,
  style = {}
}) {
  const motion = useMotionOn();
  const ref = useRef(null);
  const [shown, setShown] = useState(!motion);
  useEffect(() => {
    if (!motion) {
      setShown(true);
      return;
    }
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
      if (!done) {
        done = true;
        setShown(true);
        cancelAnimationFrame(rafId);
      }
    }, 3000);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(failsafe);
    };
  }, [motion, delay]);
  const fromT = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    scale: 'scale(0.92)'
  }[from] || `translateY(${distance}px)`;
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : fromT,
      transition: 'opacity 700ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      ...style
    }
  }, children);
}

/* ─────── Parallax ─────── */
function Parallax({
  children,
  strength = 0.15,
  style = {}
}) {
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
        const progress = (center - vh / 2) / vh; // -1..1-ish
        setY(-progress * 60 * strength * 10);
      });
    }
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [motion, strength]);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      transform: motion ? `translate3d(0, ${y}px, 0)` : 'none',
      willChange: 'transform',
      ...style
    }
  }, children);
}

/* ─────── Tilt card ─────── */
function TiltCard({
  children,
  max = 6,
  lift = 4,
  style = {}
}) {
  const motion = useMotionOn();
  const ref = useRef(null);
  const [t, setT] = useState({
    rx: 0,
    ry: 0,
    l: 0
  });
  function onMove(e) {
    if (!motion) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({
      rx: (0.5 - py) * max,
      ry: (px - 0.5) * max,
      l: lift
    });
  }
  function onLeave() {
    setT({
      rx: 0,
      ry: 0,
      l: 0
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    style: {
      transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateY(-${t.l}px)`,
      transition: 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      transformStyle: 'preserve-3d',
      willChange: 'transform',
      ...style
    }
  }, children);
}

/* ─────── Wiggle (button/CTA hover) ─────── */
function Wiggle({
  children,
  style = {}
}) {
  const motion = useMotionOn();
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-block',
      animation: motion && hover ? 'wiggle 400ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
      ...style
    }
  }, children, /*#__PURE__*/React.createElement("style", null, `@keyframes wiggle { 0%{transform:rotate(0)} 25%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} 75%{transform:rotate(-1deg)} 100%{transform:rotate(0)} }`));
}

/* ─────── Spin coin (decorative) ─────── */
function SpinCoin({
  size = 48,
  style = {}
}) {
  const motion = useMotionOn();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--yellow)',
      border: '2.5px solid var(--black)',
      boxShadow: '3px 3px 0 var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      fontWeight: 900,
      color: 'var(--black)',
      animation: motion ? 'coinBob 3s ease-in-out infinite' : 'none',
      cursor: 'default',
      ...style
    },
    onMouseEnter: e => {
      if (motion) e.currentTarget.style.animation = 'coinSpin 500ms cubic-bezier(0.2, 0.8, 0.2, 1), coinBob 3s ease-in-out infinite 500ms';
    }
  }, "$", /*#__PURE__*/React.createElement("style", null, `
        @keyframes coinBob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-6px) rotate(4deg); } }
        @keyframes coinSpin { from { transform: rotateY(0); } to { transform: rotateY(720deg); } }
      `));
}
Object.assign(window, {
  MotionProvider,
  useMotionOn,
  Reveal,
  Parallax,
  TiltCard,
  Wiggle,
  SpinCoin
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "landing/Motion.jsx", error: String((e && e.message) || e) }); }

// landing/PhoneScreens.jsx
try { (() => {
/* global React */
/* Static-render variants of the mobile screens for the landing page.
   These do NOT import from ui_kits — they re-implement the essential
   visual language so the landing page stays self-contained at the root.
   All values come from colors_and_type.css. */

function LandingPhoneFrame({
  children,
  scale = 1
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      height: 680,
      position: 'relative',
      borderRadius: 42,
      overflow: 'hidden',
      background: 'var(--offwhite)',
      border: '2.5px solid var(--black)',
      boxShadow: '8px 8px 0 var(--black)',
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 96,
      height: 26,
      borderRadius: 18,
      background: 'var(--black)',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'hidden'
    }
  }, children));
}
function SmallTopBar({
  title,
  subtitle,
  emblem
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 52,
      paddingBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '52px 14px 10px',
      background: 'var(--white)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      border: '2px solid var(--black)',
      background: 'var(--yellow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      color: 'var(--black)',
      fontSize: 11
    }
  }, emblem || 'MR'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 15,
      color: 'var(--black)',
      letterSpacing: '-0.02em'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 10,
      color: 'var(--gray-600)',
      marginTop: 1
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30
    }
  }));
}
function SmallTabBar({
  items,
  active
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      display: 'flex',
      background: 'var(--white)',
      borderTop: '2.5px solid var(--black)'
    }
  }, items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.key,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: active === it.key ? 'var(--yellow)' : 'transparent',
      color: 'var(--black)',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, it.glyph), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    }
  }, it.label))));
}
function StaticTag({
  children,
  variant = 'neutral'
}) {
  const V = {
    neutral: ['var(--gray-100)', 'var(--black)'],
    brand: ['var(--yellow)', 'var(--black)'],
    soft: ['var(--yellow-soft)', 'var(--black)'],
    success: ['var(--green-soft)', 'var(--black)'],
    info: ['var(--blue-soft)', 'var(--blue)'],
    danger: ['var(--red-soft)', 'var(--red)'],
    warning: ['var(--warning-soft)', 'var(--black)']
  }[variant];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: V[0],
      color: V[1],
      border: '2px solid var(--black)',
      borderRadius: 20,
      padding: '2px 8px',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.05em'
    }
  }, children);
}
function OperativoStatic() {
  const ventas = [{
    t: 'Pan dulce × 6',
    h: '07:42',
    tg: 'Producto',
    m: 'Efectivo',
    a: '+$186.00',
    pos: true
  }, {
    t: 'Pastel cumpleaños',
    h: '08:15',
    tg: 'Producto',
    m: 'Transferencia',
    a: '+$780.00',
    pos: true
  }, {
    t: 'Harina (25kg)',
    h: '09:02',
    tg: 'Insumo',
    m: 'Efectivo',
    a: '−$640.00',
    pos: false
  }, {
    t: 'Café mesa 4',
    h: '10:24',
    tg: 'Producto',
    m: 'Efectivo',
    a: '+$145.00',
    pos: true
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      position: 'relative',
      background: 'var(--offwhite)'
    }
  }, /*#__PURE__*/React.createElement(SmallTopBar, {
    title: "Cachink",
    subtitle: "Panader\xEDa La Esquina"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 12px 66px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--yellow)',
      border: '2px solid var(--black)',
      borderRadius: 14,
      boxShadow: '4px 4px 0 var(--black)',
      padding: '14px 14px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)'
    }
  }, "Ventas hoy \xB7 24 abr"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      color: 'var(--black)',
      marginTop: 2,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, "$1,321.00"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--black)',
      opacity: 0.65
    }
  }, "Egresos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 900,
      color: 'var(--black)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "$640.00")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--black)',
      opacity: 0.65
    }
  }, "Neto"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 900,
      color: 'var(--black)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "$681.00")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 36,
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'var(--black)',
      color: 'var(--white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      boxShadow: '4px 4px 0 var(--black)'
    }
  }, "+ VENTA"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 36,
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'var(--yellow-soft)',
      color: 'var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      boxShadow: '3px 3px 0 var(--black)'
    }
  }, "+ EGRESO")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginTop: 4
    }
  }, "Movimientos de hoy"), ventas.map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 14,
      boxShadow: '3px 3px 0 var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      background: v.pos ? 'var(--yellow-soft)' : 'var(--red-soft)',
      border: '2px solid var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 900
    }
  }, v.pos ? '$' : '−'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--black)'
    }
  }, v.t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(StaticTag, {
    variant: "neutral"
  }, v.tg), /*#__PURE__*/React.createElement(StaticTag, {
    variant: v.m === 'Efectivo' ? 'brand' : 'info'
  }, v.m))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: v.pos ? 'var(--green)' : 'var(--red)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, v.a)))), /*#__PURE__*/React.createElement(SmallTabBar, {
    active: "home",
    items: [{
      key: 'home',
      label: 'Inicio',
      glyph: '⌂'
    }, {
      key: 'ventas',
      label: 'Ventas',
      glyph: '$'
    }, {
      key: 'corte',
      label: 'Corte',
      glyph: '▤'
    }, {
      key: 'ajustes',
      label: 'Ajustes',
      glyph: '⚙'
    }]
  }));
}
function DirectorStatic() {
  const cxc = [{
    n: 'Café del Parque',
    d: 'Vence en 2 días',
    a: '$8,400',
    t: 'warning',
    lab: 'Pendiente'
  }, {
    n: 'Hotel Centro',
    d: 'Vencida · 5 días',
    a: '$14,200',
    t: 'danger',
    lab: 'Vencida'
  }, {
    n: 'Escuela Benavente',
    d: 'Vence en 12 días',
    a: '$18,700',
    t: 'neutral',
    lab: 'Al día'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      position: 'relative',
      background: 'var(--offwhite)'
    }
  }, /*#__PURE__*/React.createElement(SmallTopBar, {
    title: "Direcci\xF3n",
    subtitle: "La Esquina \xB7 Abril",
    emblem: "DIR"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 12px 66px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--black)',
      border: '2.5px solid var(--black)',
      borderRadius: 14,
      boxShadow: '5px 5px 0 var(--black)',
      padding: '14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#D6D6D2'
    }
  }, "Utilidad neta \xB7 mes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      color: 'var(--white)',
      marginTop: 2,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1
    }
  }, "$184,320"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(StaticTag, {
    variant: "success"
  }, "+18% vs. marzo"), /*#__PURE__*/React.createElement(StaticTag, {
    variant: "soft"
  }, "Meta 92%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [['Ventas mes', '$486k', 'var(--green)'], ['Egresos', '$302k', 'var(--black)'], ['CxC', '$48.3k', 'var(--black)'], ['Efectivo', '$92.1k', 'var(--green)']].map(([l, v, c], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 14,
      boxShadow: '3px 3px 0 var(--black)',
      padding: '10px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)'
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      letterSpacing: '-0.03em',
      color: c,
      fontVariantNumeric: 'tabular-nums',
      marginTop: 2
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 14,
      boxShadow: '3px 3px 0 var(--black)',
      padding: '10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginBottom: 8
    }
  }, "Salud financiera"), [['Margen bruto', 62, 'var(--green)', '62%'], ['Liquidez', 60, 'var(--warning)', '1.8 / 3'], ['Meta mes', 92, 'var(--yellow)', '92%']].map(([l, p, c, v], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginBottom: i < 2 ? 8 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--black)'
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--gray-600)'
    }
  }, v)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      background: 'var(--gray-100)',
      border: '2px solid var(--black)',
      borderRadius: 8,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${p}%`,
      background: c
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginTop: 2
    }
  }, "Cuentas por cobrar"), cxc.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 10px',
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 14,
      boxShadow: '3px 3px 0 var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--black)'
    }
  }, c.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      color: c.t === 'danger' ? 'var(--red)' : 'var(--gray-600)',
      marginTop: 2
    }
  }, c.d)), /*#__PURE__*/React.createElement(StaticTag, {
    variant: c.t
  }, c.lab), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: 'var(--black)',
      fontVariantNumeric: 'tabular-nums',
      minWidth: 52,
      textAlign: 'right'
    }
  }, c.a)))), /*#__PURE__*/React.createElement(SmallTabBar, {
    active: "home",
    items: [{
      key: 'home',
      label: 'Panel',
      glyph: '▥'
    }, {
      key: 'cxc',
      label: 'CxC',
      glyph: '$'
    }, {
      key: 'stock',
      label: 'Stock',
      glyph: '▣'
    }, {
      key: 'ajustes',
      label: 'Ajustes',
      glyph: '⚙'
    }]
  }));
}
function NuevaVentaStatic() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      position: 'relative',
      background: 'var(--offwhite)'
    }
  }, /*#__PURE__*/React.createElement(SmallTopBar, {
    title: "Nueva venta",
    subtitle: "24 abr \xB7 10:48"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 14px 14px'
    }
  }, [{
    l: 'MONTO (MXN)',
    v: '$1,240.00',
    n: 'Sin IVA. Se redondea al guardar.'
  }, {
    l: 'CONCEPTO',
    v: 'Pan dulce × 4'
  }, {
    l: 'CATEGORÍA',
    v: 'Producto ▾'
  }].map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginBottom: 4
    }
  }, f.l), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 12,
      padding: '10px 12px',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--ink)'
    }
  }, f.v), f.n && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: 'var(--gray-400)',
      fontWeight: 500,
      marginTop: 3
    }
  }, f.n))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--gray-600)',
      marginBottom: 6
    }
  }, "M\xC9TODO DE PAGO"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, [['Efectivo', true], ['Transfer.', false], ['Tarjeta', false]].map(([m, sel], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '9px 0',
      border: '2px solid var(--black)',
      borderRadius: 12,
      background: sel ? 'var(--yellow)' : 'var(--white)',
      fontWeight: 700,
      fontSize: 11,
      color: 'var(--black)',
      boxShadow: sel ? '3px 3px 0 var(--black)' : 'none'
    }
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '11px 0',
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'transparent',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '11px 0',
      border: '2px solid var(--black)',
      borderRadius: 10,
      background: 'var(--yellow)',
      boxShadow: '4px 4px 0 var(--black)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--black)'
    }
  }, "Guardar"))));
}
Object.assign(window, {
  LandingPhoneFrame,
  OperativoStatic,
  DirectorStatic,
  NuevaVentaStatic
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "landing/PhoneScreens.jsx", error: String((e && e.message) || e) }); }

// landing/Sections.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React, LandingPhoneFrame, OperativoStatic, DirectorStatic, NuevaVentaStatic,
   AnimatedOperativo, Reveal, Parallax, TiltCard, Wiggle, SpinCoin, useMotionOn,
   TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakSelect, useTweaks */

const {
  useState,
  useEffect,
  useRef
} = React;

/* ─────────────── Copy decks for the 3 tones ─────────────── */
const TONE_COPY = {
  punchy: {
    eyebrow: '¡CACHINK! · FINANZAS CLARAS',
    h1a: 'Tu caja, clara.',
    h1b: 'Cada día.',
    sub: 'Registra ventas y egresos en 3 segundos. Ve lo que ganas hoy, sin hojas de Excel ni contadores.',
    cta1: 'Entrar a la lista',
    cta2: 'Ver cómo funciona',
    why: [{
      t: 'Tres segundos por venta',
      d: 'Abres, anotas, listo. Sin menús anidados.'
    }, {
      t: 'Offline siempre',
      d: 'Aunque se caiga el internet, tu caja no para.'
    }, {
      t: 'Sin suscripciones infinitas',
      d: 'Un plan gratis generoso, un plan pro honesto.'
    }],
    howTitle: 'Así funciona',
    how: [{
      n: '01',
      t: 'Capturas',
      d: 'Cada venta o egreso del día. Tarda menos que abrir WhatsApp.'
    }, {
      n: '02',
      t: 'Ves',
      d: 'Ventas de hoy, del mes, efectivo en caja. Actualizado al instante.'
    }, {
      n: '03',
      t: 'Decides',
      d: 'KPIs para dueños, estados financieros para tu contador.'
    }]
  },
  educational: {
    eyebrow: 'CACHINK · CONTROL FINANCIERO PARA NEGOCIOS PEQUEÑOS',
    h1a: 'Deja de adivinar',
    h1b: 'cuánto ganaste hoy.',
    sub: 'Cachink es una app mexicana pensada para dueños de negocios pequeños. Registras lo que entra y lo que sale, y ella te dice — en español y en pesos — cómo va tu negocio de verdad.',
    cta1: 'Quiero probarla cuando salga',
    cta2: 'Conocer los módulos',
    why: [{
      t: 'Pensada en español, para México',
      d: 'IVA, NIF, CFDI, MXN. No traducimos software gringo.'
    }, {
      t: 'Tu información es tuya',
      d: 'Los datos viven en tu dispositivo. La nube es opcional.'
    }, {
      t: 'Tan simple como una libreta',
      d: 'Si sabes anotar en una libreta, sabes usar Cachink.'
    }],
    howTitle: 'Así te ayuda, paso a paso',
    how: [{
      n: '01',
      t: 'Registras cada movimiento',
      d: 'Ventas, egresos, inventario. En segundos, sin fórmulas.'
    }, {
      n: '02',
      t: 'Cachink hace las cuentas',
      d: 'Corte del día, utilidad del mes, cuentas por cobrar — automático.'
    }, {
      n: '03',
      t: 'Compartes con tu contador',
      d: 'Exporta estados financieros en el formato que él necesita.'
    }]
  },
  playful: {
    eyebrow: '¡CACHINK! · EL SONIDO DE QUE TU NEGOCIO VA BIEN',
    h1a: '¡Cachink!',
    h1b: 'Sonó otra venta.',
    sub: 'La app más honesta para llevar la caja de tu negocio. Sin Excel, sin drama, sin inglés de software caro.',
    cta1: 'Avísame cuando salga',
    cta2: 'Ver la demo',
    why: [{
      t: 'Rápida como la caja registradora',
      d: 'Un toque. ¡Cachink! Venta guardada.'
    }, {
      t: 'Clara como un recibo',
      d: 'Lo que entró, lo que salió, lo que queda. Sin adornos.'
    }, {
      t: 'Para quienes hacen, no para quienes reportan',
      d: 'Menos botones. Más negocio.'
    }],
    howTitle: '¿Cómo se usa? Así',
    how: [{
      n: '01',
      t: 'Anotas',
      d: 'La venta de la doña, el café del cliente fiel, la compra del día.'
    }, {
      n: '02',
      t: 'Miras',
      d: 'Ventas hoy, utilidad del mes, qué te deben. De un vistazo.'
    }, {
      n: '03',
      t: 'Creces',
      d: 'Con números reales — no con la corazonada de siempre.'
    }]
  }
};

/* ─────────────── Small bits ─────────────── */
const Eyebrow = ({
  children,
  light
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: light ? '#D6D6D2' : 'var(--gray-600)'
  }
}, children);
const HardBtn = ({
  children,
  variant = 'primary',
  size = 'lg',
  onClick,
  href
}) => {
  const V = {
    primary: {
      bg: 'var(--yellow)',
      fg: 'var(--black)'
    },
    dark: {
      bg: 'var(--black)',
      fg: 'var(--white)'
    },
    ghost: {
      bg: 'transparent',
      fg: 'var(--black)'
    },
    white: {
      bg: 'var(--white)',
      fg: 'var(--black)'
    }
  }[variant];
  const S = size === 'lg' ? {
    h: 54,
    px: 22,
    fs: 14
  } : {
    h: 44,
    px: 18,
    fs: 12
  };
  const [p, setP] = useState(false);
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    onMouseLeave: () => setP(false),
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      background: V.bg,
      color: V.fg,
      border: '2px solid var(--black)',
      borderRadius: 12,
      height: S.h,
      padding: `0 ${S.px}px`,
      fontSize: S.fs,
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      userSelect: 'none',
      boxShadow: p ? '1px 1px 0 var(--black)' : '4px 4px 0 var(--black)',
      transform: p ? 'translate(3px,3px)' : 'none',
      transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
      textDecoration: 'none'
    }
  }, children);
};
const HardCard = ({
  children,
  variant = 'white',
  padding = 24,
  style
}) => {
  const BG = {
    white: 'var(--white)',
    yellow: 'var(--yellow)',
    black: 'var(--black)',
    offwhite: 'var(--offwhite)'
  }[variant];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: BG,
      border: `${variant === 'black' ? 2.5 : 2}px solid var(--black)`,
      borderRadius: 18,
      boxShadow: variant === 'black' ? '6px 6px 0 var(--black)' : '5px 5px 0 var(--black)',
      padding,
      ...style
    }
  }, children);
};

/* ─────────────── NAV ─────────────── */
function Nav({
  onWaitlist
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'relative',
      zIndex: 40,
      background: 'var(--white)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '18px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#top",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      textDecoration: 'none',
      color: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo.png",
    alt: "Cachink",
    style: {
      height: 180
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      gap: 28,
      justifyContent: 'center'
    }
  }, [['#por-que', 'Por qué Cachink'], ['#como', 'Cómo funciona'], ['#recorrido', 'Recorrido'], ['#precios', 'Precios'], ['#contacto', 'Contacto']].map(([h, l]) => /*#__PURE__*/React.createElement("a", {
    key: h,
    href: h,
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--black)',
      textDecoration: 'none',
      letterSpacing: '-0.005em'
    }
  }, l))), /*#__PURE__*/React.createElement(HardBtn, {
    size: "sm",
    onClick: onWaitlist
  }, "Lista de espera")));
}

/* ─────────────── HERO ─────────────── */
function Hero({
  tone,
  yellowIntensity,
  onSubmitEmail
}) {
  const c = TONE_COPY[tone];
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const heroBg = yellowIntensity === 'high' ? 'var(--yellow)' : yellowIntensity === 'medium' ? 'var(--yellow)' : 'var(--offwhite)';
  const heroFg = yellowIntensity === 'low' ? 'var(--black)' : 'var(--black)';

  // Sparkle marks on yellow background
  const sparkles = yellowIntensity !== 'low';
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    style: {
      background: heroBg,
      color: heroFg,
      borderBottom: '2.5px solid var(--black)',
      position: 'relative',
      overflow: 'hidden'
    }
  }, sparkles && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      top: 60,
      left: '6%'
    },
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "var(--black)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z"
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      top: 180,
      left: '2%'
    },
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "var(--black)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z"
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      bottom: 80,
      right: '6%'
    },
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "var(--black)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '64px 28px 72px',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, c.eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '14px 0 16px',
      fontWeight: 900,
      fontSize: tone === 'playful' ? 88 : 76,
      lineHeight: 0.95,
      letterSpacing: '-0.045em',
      color: 'var(--black)'
    }
  }, c.h1a, /*#__PURE__*/React.createElement("br", null), c.h1b), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      fontWeight: 500,
      color: 'var(--ink)',
      maxWidth: 540,
      lineHeight: 1.45,
      margin: '0 0 28px'
    }
  }, c.sub), /*#__PURE__*/React.createElement(HardCard, {
    variant: "white",
    padding: 18,
    style: {
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Pr\xF3ximamente \xB7 \xDAnete a la lista"), sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: '14px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: 'var(--green-soft)',
      border: '2px solid var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      color: 'var(--green)'
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 15,
      color: 'var(--black)'
    }
  }, "\xA1Est\xE1s en la lista!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--gray-600)',
      fontWeight: 500
    }
  }, "Te avisamos el d\xEDa del lanzamiento."))) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      if (email.includes('@')) {
        setSent(true);
        onSubmitEmail && onSubmitEmail(email);
      }
    },
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    type: "email",
    required: true,
    placeholder: "tu@correo.com",
    style: {
      flex: 1,
      border: '2px solid var(--black)',
      borderRadius: 12,
      padding: '12px 14px',
      fontSize: 15,
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      color: 'var(--ink)',
      background: 'var(--white)',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement(HardBtn, {
    size: "sm",
    variant: "dark"
  }, c.cta1)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    platform: "ios"
  }), /*#__PURE__*/React.createElement(StoreBadge, {
    platform: "android"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--gray-400)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    }
  }, "Verano 2026")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Parallax, {
    strength: 0.25
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      transform: 'rotate(-3deg)'
    }
  }, /*#__PURE__*/React.createElement(LandingPhoneFrame, null, /*#__PURE__*/React.createElement(AnimatedOperativo, null)))))));
}

/* ─────────────── Store badge (grayed) ─────────────── */
function StoreBadge({
  platform
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--gray-100)',
      color: 'var(--gray-400)',
      border: '2px dashed var(--gray-400)',
      borderRadius: 12,
      padding: '8px 12px',
      opacity: 0.8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 900
    }
  }, platform === 'ios' ? '' : '▶'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.05
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "Pr\xF3ximamente en"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--gray-600)'
    }
  }, platform === 'ios' ? 'App Store' : 'Google Play')));
}

/* ─────────────── POR QUÉ / audience card ─────────────── */

/* Custom neobrutalist SVG icons for audience cards */
const IconBakery = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 56 56",
  width: "40",
  height: "40",
  fill: "none",
  stroke: "var(--black)",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 34 C 6 22, 16 12, 28 12 C 40 12, 50 22, 50 34 C 50 38, 46 40, 42 38 L 36 36 L 28 38 L 20 36 L 14 38 C 10 40, 6 38, 6 34 Z",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14 28 L 20 32"
}), /*#__PURE__*/React.createElement("path", {
  d: "M22 22 L 26 30"
}), /*#__PURE__*/React.createElement("path", {
  d: "M30 20 L 32 30"
}), /*#__PURE__*/React.createElement("path", {
  d: "M38 22 L 36 30"
}), /*#__PURE__*/React.createElement("path", {
  d: "M44 28 L 40 32"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20 8 C 20 6, 22 6, 22 4",
  stroke: "var(--gray-600)",
  strokeWidth: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M28 6 C 28 4, 30 4, 30 2",
  stroke: "var(--gray-600)",
  strokeWidth: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M36 8 C 36 6, 38 6, 38 4",
  stroke: "var(--gray-600)",
  strokeWidth: "2"
}));
const IconShop = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 56 56",
  width: "40",
  height: "40",
  fill: "none",
  stroke: "var(--black)",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 14 L 50 14 L 46 22 L 10 22 Z",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 14 L 14 22 M 26 14 L 26 22 M 36 14 L 38 22"
}), /*#__PURE__*/React.createElement("path", {
  d: "M10 22 L 10 48 L 46 48 L 46 22",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("rect", {
  x: "22",
  y: "32",
  width: "12",
  height: "16",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "31",
  cy: "40",
  r: "0.9",
  fill: "var(--black)",
  stroke: "none"
}), /*#__PURE__*/React.createElement("rect", {
  x: "13",
  y: "26",
  width: "7",
  height: "6",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("rect", {
  x: "36",
  y: "26",
  width: "7",
  height: "6",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("path", {
  d: "M4 48 L 52 48"
}), /*#__PURE__*/React.createElement("rect", {
  x: "23",
  y: "18",
  width: "10",
  height: "3",
  fill: "var(--black)",
  stroke: "none"
}));
const IconToolbox = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 56 56",
  width: "40",
  height: "40",
  fill: "none",
  stroke: "var(--black)",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M14 26 L 18 16 L 38 16 L 42 26",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("path", {
  d: "M28 16 L 28 26"
}), /*#__PURE__*/React.createElement("path", {
  d: "M6 36 L 8 26 L 48 26 L 50 36 L 50 40 L 6 40 Z",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("rect", {
  x: "46",
  y: "30",
  width: "3",
  height: "3",
  fill: "var(--black)",
  stroke: "none"
}), /*#__PURE__*/React.createElement("rect", {
  x: "7",
  y: "30",
  width: "3",
  height: "3",
  fill: "var(--black)",
  stroke: "none"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "16",
  cy: "42",
  r: "5",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "16",
  cy: "42",
  r: "1.8",
  fill: "var(--black)",
  stroke: "none"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "40",
  cy: "42",
  r: "5",
  fill: "var(--yellow)"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "40",
  cy: "42",
  r: "1.8",
  fill: "var(--black)",
  stroke: "none"
}), /*#__PURE__*/React.createElement("path", {
  d: "M32 10 L 38 4",
  strokeWidth: "2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "31",
  cy: "11",
  r: "2",
  fill: "var(--yellow)",
  strokeWidth: "2"
}));
function ParaQuienEs({
  tone
}) {
  const c = TONE_COPY[tone];
  return /*#__PURE__*/React.createElement("section", {
    id: "por-que",
    style: {
      background: 'var(--offwhite)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '80px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 40,
      alignItems: 'end',
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Para qui\xE9n es Cachink"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '10px 0 0',
      fontSize: 52,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      lineHeight: 1,
      color: 'var(--black)',
      textWrap: 'pretty'
    }
  }, "Si llevas la caja en la cabeza o en una libreta \u2014 esto es para ti.")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      color: 'var(--ink)',
      fontWeight: 500,
      lineHeight: 1.5,
      margin: 0,
      maxWidth: 460
    }
  }, "Cachink est\xE1 hecho para due\xF1os de negocios peque\xF1os que capturan cada venta a mano. Panader\xEDas, caf\xE9s, tiendas de barrio, talleres, consultorios.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20
    }
  }, [{
    Icon: IconBakery,
    t: 'Panaderías y cafés',
    d: 'Decenas de ventas chicas al día. Cachink te lleva el corte del día sin hacer cuentas a mano.'
  }, {
    Icon: IconShop,
    t: 'Tiendas de barrio',
    d: 'Efectivo, fiado, transferencia. Registras cómo te pagaron y ves qué te deben.'
  }, {
    Icon: IconToolbox,
    t: 'Talleres y servicios',
    d: 'Trabajos chicos con insumos. Cachink separa ingresos de costos y te da la utilidad real.'
  }].map((x, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    delay: i * 120,
    from: "up"
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 5,
    lift: 6
  }, /*#__PURE__*/React.createElement(HardCard, {
    padding: 24
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 16,
      background: 'var(--yellow)',
      border: '2.5px solid var(--black)',
      boxShadow: '3px 3px 0 var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(x.Icon, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: 'var(--black)',
      marginBottom: 8
    }
  }, x.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--gray-600)',
      fontWeight: 500,
      lineHeight: 1.5
    }
  }, x.d)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20,
      marginTop: 24
    }
  }, c.why.map((x, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    delay: i * 100,
    from: "up"
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 5,
    lift: 5
  }, /*#__PURE__*/React.createElement(HardCard, {
    padding: 24,
    variant: i === 1 ? 'yellow' : 'white'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: 'var(--black)',
      marginBottom: 6
    }
  }, x.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--ink)',
      fontWeight: 500,
      lineHeight: 1.5
    }
  }, x.d))))))));
}

/* ─────────────── CÓMO FUNCIONA ─────────────── */
function ComoFunciona({
  tone,
  darkSection
}) {
  const c = TONE_COPY[tone];
  const onDark = darkSection;
  return /*#__PURE__*/React.createElement("section", {
    id: "como",
    style: {
      background: onDark ? 'var(--black)' : 'var(--yellow)',
      color: onDark ? 'var(--white)' : 'var(--black)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '80px 28px'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    light: onDark
  }, c.howTitle), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '10px 0 44px',
      fontSize: 52,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      lineHeight: 1,
      color: onDark ? 'var(--white)' : 'var(--black)'
    }
  }, "Tres pasos. Todos los d\xEDas."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20
    }
  }, c.how.map((s, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    delay: i * 140,
    from: "up"
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 7,
    lift: 8
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: onDark ? 'var(--white)' : 'var(--white)',
      border: '2px solid var(--black)',
      borderRadius: 18,
      boxShadow: '5px 5px 0 var(--black)',
      padding: 28,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -18,
      left: 20,
      background: 'var(--black)',
      color: 'var(--yellow)',
      fontWeight: 900,
      fontSize: 16,
      letterSpacing: '0.08em',
      padding: '6px 12px',
      borderRadius: 10,
      border: '2px solid var(--black)'
    }
  }, s.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: '-0.03em',
      color: 'var(--black)',
      marginTop: 8,
      marginBottom: 10
    }
  }, s.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: 'var(--gray-600)',
      fontWeight: 500,
      lineHeight: 1.55
    }
  }, s.d))))))));
}

/* ─────────────── RECORRIDO (feature tour) ─────────────── */
function Recorrido() {
  const rows = [{
    Phone: OperativoStatic,
    eyebrow: '01 · OPERATIVO',
    title: 'Tu caja, cada mañana.',
    desc: 'Abres la app. Ves lo que vendiste ayer, lo que te queda en caja, y lo que está pendiente de capturar. Todo en una pantalla.',
    bullets: ['Ventas del día en grande', 'Movimientos con método de pago', 'Corte de día de un toque'],
    bg: 'var(--offwhite)',
    rotate: -2
  }, {
    Phone: NuevaVentaStatic,
    eyebrow: '02 · CAPTURA',
    title: 'Una venta, en tres segundos.',
    desc: 'Monto, concepto, método de pago. Nada más. El formulario se adapta al giro de tu negocio — si solo cobras efectivo, ni ves las otras opciones.',
    bullets: ['Monto en MXN, sin calcular IVA a mano', 'Métodos en botones grandes', 'Guarda offline; sincroniza después'],
    bg: 'var(--white)',
    rotate: 3
  }, {
    Phone: DirectorStatic,
    eyebrow: '03 · DIRECTOR',
    title: 'El panel que tu contador entiende.',
    desc: 'Si no eres quien captura, tienes un panel aparte. Utilidad del mes, cuentas por cobrar, liquidez, meta. Lectura solamente — no rompes nada.',
    bullets: ['KPIs financieros al vuelo', 'CxC con días de vencimiento', 'Estados financieros exportables'],
    bg: 'var(--offwhite)',
    rotate: -3
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "recorrido",
    style: {
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--white)',
      borderBottom: '2.5px solid var(--black)',
      padding: '72px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Recorrido"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '10px 0 0',
      fontSize: 56,
      fontWeight: 900,
      letterSpacing: '-0.045em',
      lineHeight: 1,
      color: 'var(--black)',
      textWrap: 'pretty',
      maxWidth: 820
    }
  }, "Un recorrido por las tres pantallas que usar\xE1s todos los d\xEDas."))), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: r.bg,
      borderBottom: '2.5px solid var(--black)',
      padding: '80px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: i % 2 === 0 ? '1fr 1.1fr' : '1.1fr 1fr',
      gap: 60,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      order: i % 2 === 0 ? 1 : 2
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    from: i % 2 === 0 ? 'right' : 'left',
    distance: 32
  }, /*#__PURE__*/React.createElement(Eyebrow, null, r.eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '10px 0 14px',
      fontSize: 44,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      lineHeight: 1.02,
      color: 'var(--black)'
    }
  }, r.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: 'var(--ink)',
      fontWeight: 500,
      lineHeight: 1.5,
      margin: '0 0 22px',
      maxWidth: 520
    }
  }, r.desc), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, r.bullets.map((b, j) => /*#__PURE__*/React.createElement("li", {
    key: j,
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      fontSize: 15,
      fontWeight: 600,
      color: 'var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      flexShrink: 0,
      borderRadius: 8,
      background: 'var(--yellow)',
      border: '2px solid var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 900
    }
  }, "\u2713"), b))))), /*#__PURE__*/React.createElement("div", {
    style: {
      order: i % 2 === 0 ? 2 : 1,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Parallax, {
    strength: 0.3
  }, /*#__PURE__*/React.createElement(Reveal, {
    from: i % 2 === 0 ? 'left' : 'right',
    distance: 40
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 8,
    lift: 10
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      transform: `rotate(${r.rotate}deg)`
    }
  }, /*#__PURE__*/React.createElement(LandingPhoneFrame, null, /*#__PURE__*/React.createElement(r.Phone, null)))))))))));
}

/* ─────────────── PRECIOS ─────────────── */
function Precios() {
  const tiers = [{
    name: 'Gratis',
    price: '$0',
    cad: '/ para siempre',
    features: ['Ventas + egresos ilimitados', '1 dispositivo', 'Corte de día', 'Exportar a CSV'],
    variant: 'white',
    cta: 'Empezar gratis'
  }, {
    name: 'Pro',
    price: '$149',
    cad: '/ mes MXN',
    features: ['Todo lo de Gratis', 'Multi-dispositivo sincronizado', 'Panel Director', 'Estados financieros NIF', 'Soporte por WhatsApp'],
    variant: 'yellow',
    cta: 'Probar Pro',
    featured: true
  }, {
    name: 'Contador',
    price: '$299',
    cad: '/ mes MXN',
    features: ['Todo lo de Pro', 'Hasta 10 negocios', 'Exportación fiscal', 'Multi-usuario con permisos'],
    variant: 'white',
    cta: 'Hablar con ventas'
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "precios",
    style: {
      background: 'var(--offwhite)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '80px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Precios \xB7 honestos"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '10px 0 10px',
      fontSize: 52,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      lineHeight: 1,
      color: 'var(--black)'
    }
  }, "Sin trucos. Sin letra chica."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      color: 'var(--gray-600)',
      fontWeight: 500,
      margin: 0,
      maxWidth: 560,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  }, "Precios preliminares para el lanzamiento. Los suscriptores de la lista de espera tendr\xE1n 3 meses gratis en cualquier plan.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20,
      alignItems: 'start'
    }
  }, tiers.map((t, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    delay: i * 120,
    from: "up"
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 5,
    lift: t.featured ? 12 : 6
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: t.variant === 'yellow' ? 'var(--yellow)' : 'var(--white)',
      border: '2.5px solid var(--black)',
      borderRadius: 20,
      boxShadow: t.featured ? '8px 8px 0 var(--black)' : '5px 5px 0 var(--black)',
      padding: 28,
      position: 'relative',
      transform: t.featured ? 'translateY(-8px)' : 'none'
    }
  }, t.featured && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -14,
      right: 20,
      background: 'var(--black)',
      color: 'var(--yellow)',
      fontSize: 10,
      fontWeight: 800,
      padding: '5px 10px',
      borderRadius: 8,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, "Recomendado"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--gray-600)'
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      color: 'var(--black)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, t.price), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--gray-600)'
    }
  }, t.cad)), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: '18px 0 22px',
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, t.features.map((f, j) => /*#__PURE__*/React.createElement("li", {
    key: j,
    style: {
      display: 'flex',
      gap: 10,
      fontSize: 14,
      color: 'var(--black)',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 18,
      height: 18,
      flexShrink: 0,
      borderRadius: 6,
      background: 'var(--white)',
      border: '2px solid var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 900
    }
  }, "\u2713"), f))), /*#__PURE__*/React.createElement(HardBtn, {
    size: "sm",
    variant: t.featured ? 'dark' : 'white'
  }, t.cta))))))));
}

/* ─────────────── CONTACTO ─────────────── */
function Contacto({
  darkSection
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "contacto",
    style: {
      background: darkSection ? 'var(--black)' : 'var(--yellow)',
      borderBottom: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '80px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: 48,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    light: darkSection
  }, "Contacto"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '10px 0 20px',
      fontSize: 56,
      fontWeight: 900,
      letterSpacing: '-0.045em',
      lineHeight: 0.98,
      color: darkSection ? 'var(--white)' : 'var(--black)'
    }
  }, "\xBFTienes preguntas? Escr\xEDbenos."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: darkSection ? '#D6D6D2' : 'var(--ink)',
      fontWeight: 500,
      lineHeight: 1.5,
      margin: '0 0 24px',
      maxWidth: 520
    }
  }, "Respondemos el mismo d\xEDa, en espa\xF1ol, como humanos. Nada de chatbots.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    delay: 80,
    from: "right"
  }, /*#__PURE__*/React.createElement("a", {
    href: "mailto:hola@cachink.mx",
    style: {
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 6,
    lift: 6
  }, /*#__PURE__*/React.createElement(HardCard, {
    padding: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: 'var(--yellow-soft)',
      border: '2px solid var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22
    }
  }, "\u2709"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--gray-600)'
    }
  }, "Correo"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: 'var(--black)',
      letterSpacing: '-0.02em',
      marginTop: 2
    }
  }, "hola@cachink.mx")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 900
    }
  }, "\u2192")))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 220,
    from: "right"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/525555555555",
    target: "_blank",
    rel: "noreferrer",
    style: {
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(TiltCard, {
    max: 6,
    lift: 6
  }, /*#__PURE__*/React.createElement(HardCard, {
    padding: 20,
    variant: "white",
    style: {
      background: 'var(--green-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: 'var(--green)',
      border: '2px solid var(--black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22,
      color: 'var(--white)',
      fontWeight: 900
    }
  }, "W"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--gray-600)'
    }
  }, "WhatsApp \xB7 lun\u2013vie 9\u201318"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: 'var(--black)',
      letterSpacing: '-0.02em',
      marginTop: 2
    }
  }, "+52 55 5555 5555")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 900
    }
  }, "\u2192"))))))))));
}

/* ─────────────── FOOTER ─────────────── */

/* Social SVG icons — uniform 22×22 stroked glyphs with brand weight. */
const SocialIG = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  width: "20",
  height: "20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "3",
  width: "18",
  height: "18",
  rx: "5"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "17.5",
  cy: "6.5",
  r: "1.1",
  fill: "currentColor",
  stroke: "none"
}));
const SocialTikTok = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  width: "20",
  height: "20",
  fill: "currentColor"
}, /*#__PURE__*/React.createElement("path", {
  d: "M19.5 7.2a6.6 6.6 0 0 1-3.9-1.3v8.6a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.8V2h3a3.6 3.6 0 0 0 3.9 3.6v1.6Z"
}));
const SocialX = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  width: "20",
  height: "20",
  fill: "currentColor"
}, /*#__PURE__*/React.createElement("path", {
  d: "M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.4L4.8 21H1.6l7.5-8.6L1.2 3h6.6l4.5 6 5.2-6Zm-1.1 16.2h1.8L7.7 4.7H5.8l10.6 14.5Z"
}));
const SocialYouTube = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  width: "22",
  height: "22",
  fill: "currentColor"
}, /*#__PURE__*/React.createElement("path", {
  d: "M21.8 7.5a2.5 2.5 0 0 0-1.8-1.8C18.4 5.3 12 5.3 12 5.3s-6.4 0-8 .4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 1.8 12a26 26 0 0 0 .4 4.5 2.5 2.5 0 0 0 1.8 1.8c1.6.4 8 .4 8 .4s6.4 0 8-.4a2.5 2.5 0 0 0 1.8-1.8 26 26 0 0 0 .4-4.5 26 26 0 0 0-.4-4.5ZM10 15.2V8.8L15.5 12 10 15.2Z"
}));
const SOCIALS = [{
  k: 'ig',
  Icon: SocialIG,
  label: 'Instagram',
  href: 'https://instagram.com/cachink'
}, {
  k: 'tt',
  Icon: SocialTikTok,
  label: 'TikTok',
  href: 'https://tiktok.com/@cachink'
}, {
  k: 'x',
  Icon: SocialX,
  label: 'X',
  href: 'https://x.com/cachink'
}, {
  k: 'yt',
  Icon: SocialYouTube,
  label: 'YouTube',
  href: 'https://youtube.com/@cachink'
}];
function SocialButton({
  Icon,
  label,
  href
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    target: "_blank",
    rel: "noreferrer",
    "aria-label": label,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: 46,
      height: 46,
      borderRadius: 12,
      background: h ? 'var(--yellow)' : 'var(--white)',
      border: '2.5px solid var(--black)',
      boxShadow: h ? '2px 2px 0 var(--black)' : '4px 4px 0 var(--black)',
      transform: h ? 'translate(2px, 2px)' : 'none',
      transition: 'transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 140ms, background 140ms',
      color: 'var(--black)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, null));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--white)',
      color: 'var(--black)',
      borderTop: '2.5px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '48px 28px 36px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      gap: 40,
      alignItems: 'center',
      paddingBottom: 28,
      borderBottom: '2px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/logo.png",
    alt: "Cachink",
    style: {
      height: 56,
      width: 'auto',
      alignSelf: 'flex-start'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 900,
      letterSpacing: '-0.03em',
      color: 'var(--black)',
      lineHeight: 1.15,
      maxWidth: 440
    }
  }, "Finanzas para emprendedores.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gray-600)',
      fontWeight: 700
    }
  }, "Hecho en M\xE9xico, con cari\xF1o."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--gray-600)'
    }
  }, "S\xEDguenos"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, SOCIALS.map(s => /*#__PURE__*/React.createElement(SocialButton, _extends({
    key: s.k
  }, s)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
      paddingTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--gray-600)',
      fontWeight: 500
    }
  }, "\xA9 2026 Cachink \xB7 Todos los derechos reservados"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--yellow)',
      border: '2px solid var(--black)',
      borderRadius: 10,
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "\uD83C\uDDF2\uD83C\uDDFD Hecho en M\xE9xico"))));
}
Object.assign(window, {
  Nav,
  Hero,
  ParaQuienEs,
  ComoFunciona,
  Recorrido,
  Precios,
  Contacto,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "landing/Sections.jsx", error: String((e && e.message) || e) }); }

// packages/ui/src/theme.ts
try { (() => {
/**
 * Cachink brand tokens — the neobrutalist-yellow visual DNA.
 *
 * All values are encoded exactly from CLAUDE.md §8. This file is the single
 * source of truth for colors, typography, shape, and shadow scales. Tamagui's
 * theme config (to be added in Phase 1A) consumes these constants, and any
 * future platform-specific rendering (e.g. Tauri-only web CSS) imports the
 * same values.
 *
 * Do not add colors, sizes, or shadows outside this file. If a designer
 * proposes a new token, add it here with a comment explaining the use case.
 */

const colors = {
  // Brand
  yellow: '#FFD60A',
  // Amarillo Vibrante — hero color
  yellowDeep: '#F5C800',
  yellowSoft: '#FFFBCC',
  // Ink
  black: '#0D0D0D',
  // All borders, all primary text
  ink: '#1A1A18',
  // Body text (slightly softer than pure black)
  white: '#FFFFFF',
  // Surfaces
  offwhite: '#F7F7F5',
  // App background
  gray100: '#F2F2F0',
  gray200: '#E4E4E0',
  gray400: '#9E9E9A',
  // Secondary text
  gray600: '#5A5A56',
  // Label text

  // Semantic
  green: '#00C896',
  greenSoft: '#D6FFF4',
  red: '#FF4757',
  redSoft: '#FFE8EA',
  blue: '#3B6FFF',
  blueSoft: '#E5ECFF',
  warning: '#FFB800',
  warningSoft: '#FFF8E1'
};
const typography = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extraBold: 800,
    black: 900
  },
  letterSpacing: {
    tightest: '-0.04em',
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.05em',
    wider: '0.07em',
    widest: '0.08em'
  }
};

/**
 * Border radii follow a strict scale. Per CLAUDE.md §8.3, we use the scale,
 * never invent values.
 */
const radii = [8, 10, 12, 14, 16, 18, 20, 22];
/**
 * Borders are always 2 or 2.5 px solid black per CLAUDE.md §8.3. No other
 * widths. No dashed. No other colors.
 */
const borders = {
  thin: `2px solid ${colors.black}`,
  thick: `2.5px solid ${colors.black}`
};

/**
 * Shadows are HARD drop shadows only. No blur, no rgba, no soft shadows.
 * See CLAUDE.md §8.3.
 */
const shadows = {
  small: `3px 3px 0 ${colors.black}`,
  card: `4px 4px 0 ${colors.black}`,
  hero: `5px 5px 0 ${colors.black}`,
  /** Press state — the tactile feel described in §8.3. */
  pressed: `1px 1px 0 ${colors.black}`
};

/**
 * The signature press-down interaction. Apply to buttons and tappable cards.
 * Desktop hover may additionally lift the element; on press the element
 * shifts and the shadow shrinks, giving the "stamp" feel.
 */
const pressTransform = {
  from: 'translate(0, 0)',
  to: 'translate(2px, 2px)',
  shadowFrom: shadows.small,
  shadowTo: shadows.pressed,
  durationMs: 100
};
const theme = {
  colors,
  typography,
  radii,
  borders,
  shadows,
  pressTransform
};
Object.assign(__ds_scope, { colors, typography, radii, borders, shadows, pressTransform, theme });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/theme.ts", error: String((e && e.message) || e) }); }

// packages/ui/src/components/BottomTabBar/tab-item.tsx
try { (() => {
/**
 * Internal — single tab item rendered by `<BottomTabBar>`. Not exported
 * from the BottomTabBar barrel; consumers compose tabs via the
 * `BottomTabBarItem` items array on the parent.
 *
 * Extracted into its own file purely to keep `bottom-tab-bar.tsx` and the
 * tab-item rendering both well under the §4.4 file budgets.
 */

const PRESS_STYLE = {
  opacity: 0.7
};
function Badge({
  count
}) {
  return /*#__PURE__*/React.createElement(View, {
    testID: "tab-item-badge",
    backgroundColor: __ds_scope.colors.red,
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 6,
    right: 12
  }, /*#__PURE__*/React.createElement(Text, {
    color: __ds_scope.colors.white,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 10
  }, count));
}
function Label({
  text,
  active
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "tab-item-label",
    color: active ? __ds_scope.colors.black : __ds_scope.colors.gray600,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 11,
    letterSpacing: __ds_scope.typography.letterSpacing.wide,
    style: {
      textTransform: 'uppercase'
    }
  }, text);
}

/**
 * Renders one tab cell. Yellow surface when active, transparent otherwise.
 */
function TabItem(props) {
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID,
    onPress: props.onPress,
    pressStyle: PRESS_STYLE,
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: props.active ? __ds_scope.colors.yellow : 'transparent',
    cursor: "pointer",
    style: {
      userSelect: 'none'
    }
  }, props.icon !== undefined && /*#__PURE__*/React.createElement(View, {
    testID: "tab-item-icon",
    marginBottom: 2
  }, props.icon), /*#__PURE__*/React.createElement(Label, {
    text: props.label,
    active: props.active
  }), props.badge !== undefined && /*#__PURE__*/React.createElement(Badge, {
    count: props.badge
  }));
}
Object.assign(__ds_scope, { TabItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/BottomTabBar/tab-item.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/BottomTabBar/bottom-tab-bar.tsx
try { (() => {
/**
 * BottomTabBar — the Cachink bottom navigation primitive.
 *
 * Sticky horizontal strip used by both apps' shells (3-tab Operativo, 6-tab
 * Director). Per CLAUDE.md §1, the supported range is 1..6 items; a count
 * outside that range emits a dev-mode warning and renders the first 6
 * (no crash).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * The `icon` slot on each item is `ReactNode`. Phase 1A intentionally does
 * not pick an icon library — the choice is deferred to Phase 1C, where
 * concrete screen needs will inform the decision. Stories use emoji
 * placeholders.
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */

const MIN_ITEMS = 1;
const MAX_ITEMS = 6;
function clampItems(items) {
  if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) {
    // Dev-mode warning — renders the first 6 to stay crash-free.
    console.warn(`BottomTabBar expects 1..6 items; got ${items.length}. Rendering the first ${MAX_ITEMS}.`);
    return items.slice(0, MAX_ITEMS);
  }
  return items;
}

/**
 * Renders the canonical Cachink bottom navigation strip. See
 * `bottom-tab-bar.stories.tsx` for the full variant catalog.
 */
function BottomTabBar(props) {
  const items = clampItems(props.items);
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'bottom-tab-bar',
    flexDirection: "row",
    height: 68,
    backgroundColor: __ds_scope.colors.white,
    borderTopWidth: 2.5,
    borderTopColor: __ds_scope.colors.black
  }, items.map(item => /*#__PURE__*/React.createElement(__ds_scope.TabItem, {
    key: item.key,
    label: item.label,
    icon: item.icon,
    active: item.key === props.activeKey,
    onPress: item.onPress,
    badge: item.badge,
    testID: item.testID ?? `tab-${item.key}`
  })));
}
Object.assign(__ds_scope, { BottomTabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/BottomTabBar/bottom-tab-bar.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/Btn/btn.tsx
try { (() => {
/**
 * Btn — the Cachink primary button primitive.
 *
 * Implements the 6 variants from CLAUDE.md §8.4 (primary / dark / ghost /
 * green / danger / soft) with the hard-border + hard-drop-shadow +
 * press-transform interaction that defines the neobrutalist brand feel
 * described in §8.3.
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows. This is the reference pattern every
 * remaining Phase 1A primitive (Input, Tag, Modal, …) follows.
 */

const VARIANTS = {
  primary: {
    background: __ds_scope.colors.yellow,
    color: __ds_scope.colors.black,
    shadow: __ds_scope.shadows.card
  },
  dark: {
    background: __ds_scope.colors.black,
    color: __ds_scope.colors.white,
    shadow: __ds_scope.shadows.card
  },
  ghost: {
    background: 'transparent',
    color: __ds_scope.colors.black,
    shadow: 'none'
  },
  green: {
    background: __ds_scope.colors.green,
    color: __ds_scope.colors.black,
    shadow: __ds_scope.shadows.card
  },
  danger: {
    background: __ds_scope.colors.red,
    color: __ds_scope.colors.white,
    shadow: __ds_scope.shadows.card
  },
  soft: {
    background: __ds_scope.colors.yellowSoft,
    color: __ds_scope.colors.black,
    shadow: __ds_scope.shadows.small
  }
};
const SIZES = {
  sm: {
    height: 36,
    paddingX: 14,
    fontSize: 12
  },
  md: {
    height: 44,
    paddingX: 18,
    fontSize: 14
  },
  lg: {
    height: 52,
    paddingX: 22,
    fontSize: 16
  }
};
const BTN_RADIUS = __ds_scope.radii[1]; // 10 — per CLAUDE.md §8.3 scale.

/** Per CLAUDE.md §8.3: on press, shift 2px and shrink the shadow to 1×1. */
const PRESSED_STYLE = {
  transform: [{
    translateX: 2
  }, {
    translateY: 2
  }],
  style: {
    boxShadow: __ds_scope.shadows.pressed
  }
};
function BtnLabel({
  text,
  color,
  fontSize
}) {
  return /*#__PURE__*/React.createElement(Text, {
    color: color,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: fontSize,
    letterSpacing: __ds_scope.typography.letterSpacing.widest,
    style: {
      textTransform: 'uppercase'
    }
  }, text);
}

/**
 * Renders a Cachink-branded tappable button. See `btn.stories.tsx` for the
 * full variant matrix and press-state preview.
 */
function Btn(props) {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const disabled = props.disabled ?? false;
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const handlePress = disabled ? undefined : props.onPress;
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'btn',
    onPress: handlePress,
    pressStyle: disabled ? {} : PRESSED_STYLE,
    backgroundColor: v.background,
    borderColor: __ds_scope.colors.black,
    borderWidth: 2,
    borderRadius: BTN_RADIUS,
    height: s.height,
    paddingHorizontal: s.paddingX,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    width: props.fullWidth === true ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    style: {
      boxShadow: v.shadow,
      userSelect: 'none'
    }
  }, props.icon, /*#__PURE__*/React.createElement(BtnLabel, {
    text: props.children,
    color: v.color,
    fontSize: s.fontSize
  }));
}
Object.assign(__ds_scope, { Btn });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/Btn/btn.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/Card/card.tsx
try { (() => {
/**
 * Card — the Cachink container primitive.
 *
 * Three variants from CLAUDE.md §8.4 (`white` / `yellow` / `black`) wrap any
 * child content with the brand's hard 2px / 2.5px black border, hard drop
 * shadow, and 14-radius corners — the §8.3 neobrutalist signature. Every
 * Phase 1C screen composes Cards (lists, KPIs, hero metrics, Director Home
 * cards), so this is the foundational surface primitive that downstream
 * primitives (Kpi, Gauge) render inside.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * When `onPress` is provided the Card becomes tappable and inherits Btn's
 * press transform (translate 2px + shrink shadow to 1×1) — the same tactile
 * stamp feel from §8.3. When omitted the Card is inert (no cursor, no
 * pressStyle).
 *
 * Foreground color is **not** inferred for the `black` variant: consumers
 * pass dark-on-light children for white/yellow and explicitly set their
 * children's text color when rendering inside a black Card. Keeps Card
 * agnostic of its content and avoids a context (premature for Phase 1A).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows.
 */

const VARIANTS = {
  white: {
    background: __ds_scope.colors.white,
    borderWidth: 2,
    shadow: __ds_scope.shadows.card
  },
  yellow: {
    background: __ds_scope.colors.yellow,
    borderWidth: 2,
    shadow: __ds_scope.shadows.card
  },
  black: {
    background: __ds_scope.colors.black,
    borderWidth: 2.5,
    shadow: __ds_scope.shadows.hero
  }
};
const PADDINGS = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24
};

/** Card radius — 14 from the §8.3 scale, one step above Btn's 10. */
const CARD_RADIUS = __ds_scope.radii[3];

/** Per CLAUDE.md §8.3: on press, shift 2px and shrink shadow to 1×1. */
const PRESSED_STYLE = {
  transform: [{
    translateX: 2
  }, {
    translateY: 2
  }],
  style: {
    boxShadow: __ds_scope.shadows.pressed
  }
};

/**
 * Renders the canonical Cachink card surface. See `card.stories.tsx` for the
 * full variant catalog.
 */
function Card(props) {
  const variant = props.variant ?? 'white';
  const padding = props.padding ?? 'md';
  const v = VARIANTS[variant];
  const tappable = props.onPress !== undefined;
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'card',
    onPress: props.onPress,
    pressStyle: tappable ? PRESSED_STYLE : {},
    backgroundColor: v.background,
    borderColor: __ds_scope.colors.black,
    borderWidth: v.borderWidth,
    borderRadius: CARD_RADIUS,
    padding: PADDINGS[padding],
    width: props.fullWidth === true ? '100%' : undefined,
    cursor: tappable ? 'pointer' : 'default',
    style: {
      boxShadow: v.shadow,
      userSelect: 'none'
    }
  }, props.children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/Card/card.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/EmptyState/empty-state.tsx
try { (() => {
/**
 * EmptyState — the Cachink "there's nothing here yet" primitive.
 *
 * Rendered inside list views (Ventas, Egresos, Movimientos, Cuentas por
 * Cobrar, Inventario) when the list is empty OR when a search yields no
 * results. Composes an emoji, a bold title, an optional muted description,
 * and an optional action slot (typically a primary `<Btn>` CTA).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split is needed (CLAUDE.md §5.3 justified-split test: there's
 * no platform-specific capability involved). Identical rendering on mobile
 * and desktop.
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented sizes. Transparent background by design: this is content, and
 * the parent view owns the surface. Wrap in `<Card>` later (P1A-M2-T07) if
 * a hard-bordered variant is needed.
 */

function Emoji({
  glyph
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "empty-state-emoji",
    fontSize: 56,
    marginBottom: 16
  }, glyph);
}
function Title({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "empty-state-title",
    color: __ds_scope.colors.black,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.black,
    fontSize: 20,
    letterSpacing: __ds_scope.typography.letterSpacing.tight,
    textAlign: "center",
    marginBottom: 6
  }, text);
}
function Description({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "empty-state-description",
    color: __ds_scope.colors.gray400,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 20
  }, text);
}

/**
 * Renders the canonical Cachink empty-state block. See
 * `empty-state.stories.tsx` for the full variant catalog.
 */
function EmptyState(props) {
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'empty-state',
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24
  }, props.emoji !== undefined && /*#__PURE__*/React.createElement(Emoji, {
    glyph: props.emoji
  }), /*#__PURE__*/React.createElement(Title, {
    text: props.title
  }), props.description !== undefined && /*#__PURE__*/React.createElement(Description, {
    text: props.description
  }), props.action !== undefined && /*#__PURE__*/React.createElement(View, {
    marginTop: 4,
    alignItems: "center"
  }, props.action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/EmptyState/empty-state.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/Gauge/gauge.tsx
try { (() => {
/**
 * Gauge — the Cachink horizontal progress meter primitive.
 *
 * A slim, hard-bordered, hard-shadowless horizontal bar used on the
 * Indicadores screen for margins, liquidity, rotation, and any other 0..max
 * metric. Picked over a circular SVG ring (which would pull `react-native-
 * svg` as a runtime dep) for zero readability gain on a small mobile
 * surface — see plan rationale.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * `value` is clamped to `[0, max]` defensively so callers passing raw
 * computed numbers (a margin that briefly exceeds 100, a liquidity ratio
 * during a refund) never blow the layout. `max === 0` short-circuits to a
 * 0% fill (prevents a divide-by-zero NaN width).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii.
 */

const TONE_FILL = {
  neutral: __ds_scope.colors.yellow,
  positive: __ds_scope.colors.green,
  warning: __ds_scope.colors.warning,
  negative: __ds_scope.colors.red
};
const GAUGE_RADIUS = __ds_scope.radii[0]; // 8 — small pill-ish radius for the slim bar.
const TRACK_HEIGHT = 14;
function defaultFormat(value, max) {
  return max === 100 ? `${value}%` : `${value}/${max}`;
}
function clampToRange(value, max) {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}
function Header(props) {
  if (props.label === undefined && !props.showValue) return null;
  return /*#__PURE__*/React.createElement(View, {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  }, props.label !== undefined && /*#__PURE__*/React.createElement(Text, {
    testID: "gauge-label",
    color: __ds_scope.colors.black,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 13
  }, props.label), props.showValue && /*#__PURE__*/React.createElement(Text, {
    testID: "gauge-value",
    color: __ds_scope.colors.gray600,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 13
  }, props.displayValue));
}

/**
 * Renders a horizontal-bar gauge. See `gauge.stories.tsx` for the full
 * variant catalog.
 */
function Gauge(props) {
  const max = props.max ?? 100;
  const tone = props.tone ?? 'neutral';
  const showValue = props.showValue ?? true;
  const formatter = props.valueFormatter ?? defaultFormat;
  const clamped = clampToRange(props.value, max);
  const fillRatio = max === 0 ? 0 : clamped / max;
  const fillPercent = `${(fillRatio * 100).toFixed(2)}%`;
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'gauge',
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Header, {
    label: props.label,
    showValue: showValue,
    displayValue: formatter(clamped, max)
  }), /*#__PURE__*/React.createElement(View, {
    testID: "gauge-track",
    height: TRACK_HEIGHT,
    backgroundColor: __ds_scope.colors.gray100,
    borderColor: __ds_scope.colors.black,
    borderWidth: 2,
    borderRadius: GAUGE_RADIUS,
    overflow: "hidden"
  }, /*#__PURE__*/React.createElement(View, {
    testID: "gauge-fill",
    height: "100%",
    width: fillPercent,
    backgroundColor: TONE_FILL[tone]
  })));
}
Object.assign(__ds_scope, { Gauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/Gauge/gauge.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/Input/input.tsx
try { (() => {
/**
 * Input — the Cachink form-field primitive.
 *
 * Matches the prop contract from the `cachink-v3.jsx` mock verbatim
 * (`label, value, onChange, type, placeholder, options, note`) so a
 * mock-to-production migration is mechanical. Renders one of two branches:
 *
 *   • text / number / date → Tamagui's cross-platform `<Input>` primitive
 *     from `@tamagui/input`. One implementation, both targets.
 *   • select (or any time `options` is provided) → native HTML `<select>`
 *     styled with the same neobrutalist tokens. Phase 1A's pragmatic choice;
 *     a Modal-backed bottom-sheet picker replaces it on RN once
 *     `P1A-M2-T04 <Modal>` lands (see ROADMAP).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows.
 */

const FIELD_RADIUS = __ds_scope.radii[2]; // 12 — per CLAUDE.md §8.3 scale.
const ROW_MARGIN_BOTTOM = 14; // form-row rhythm from the mock.
const LABEL_MARGIN_BOTTOM = 5;
const NOTE_MARGIN_TOP = 3;

/** Shared styling for both the text-ish branch and the `<select>` branch. */
const FIELD_STYLE = {
  borderColor: __ds_scope.colors.black,
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: FIELD_RADIUS,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: 15,
  fontWeight: __ds_scope.typography.weights.medium,
  color: __ds_scope.colors.ink,
  backgroundColor: __ds_scope.colors.white,
  fontFamily: __ds_scope.typography.fontFamily,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};
function InputLabel({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    color: __ds_scope.colors.gray600,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 12,
    letterSpacing: __ds_scope.typography.letterSpacing.wide,
    marginBottom: LABEL_MARGIN_BOTTOM,
    style: {
      textTransform: 'uppercase'
    }
  }, text);
}
function InputNote({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    color: __ds_scope.colors.gray400,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.medium,
    fontSize: 11,
    marginTop: NOTE_MARGIN_TOP
  }, text);
}
/** Native HTML `<select>` styled with the same neobrutalist tokens. */
function SelectField({
  value,
  onChange,
  options
}) {
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value),
    style: FIELD_STYLE
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Seleccionar..."), (options ?? []).map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt,
    value: opt
  }, opt)));
}

/** Tamagui cross-platform `<Input>` for text / number / date. */
function TextField({
  value,
  onChange,
  placeholder,
  type
}) {
  return /*#__PURE__*/React.createElement(TamaguiInput, {
    value: value,
    onChangeText: onChange,
    placeholder: placeholder
    // The HTML `type` attribute drives keyboard / picker on web/Tauri;
    // RN's TextInput maps it via Tamagui's keyboard inference.
    ,
    type: type
    // Tamagui requires this to be a registered ColorToken (`$<name>`),
    // not a raw hex literal. `$gray400` resolves through `tamagui.config.ts`
    // back to the same `colors.gray400` value defined in `theme.ts`.
    ,
    placeholderTextColor: "$gray400",
    borderColor: __ds_scope.colors.black,
    borderWidth: 2,
    focusStyle: {
      borderWidth: 2.5,
      borderColor: __ds_scope.colors.black
    },
    borderRadius: FIELD_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: __ds_scope.typography.weights.medium,
    color: __ds_scope.colors.ink,
    backgroundColor: __ds_scope.colors.white,
    fontFamily: __ds_scope.typography.fontFamily,
    style: {
      outlineWidth: 0,
      boxShadow: 'none',
      borderStyle: 'solid'
    }
  });
}

/** Branches between the Tamagui `<Input>` and the native `<select>`. */
function InputField(props) {
  const useSelect = props.type === 'select' || Array.isArray(props.options);
  return useSelect ? /*#__PURE__*/React.createElement(SelectField, props) : /*#__PURE__*/React.createElement(TextField, props);
}

/**
 * Renders a labelled form field. See `input.stories.tsx` for the full
 * type matrix (text / number / date / select) and the canonical
 * label-with-note surface designers review.
 */
function Input(props) {
  const type = props.type ?? 'text';
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'input',
    marginBottom: ROW_MARGIN_BOTTOM
  }, props.label !== undefined && /*#__PURE__*/React.createElement(InputLabel, {
    text: props.label
  }), /*#__PURE__*/React.createElement(InputField, {
    type: type,
    value: props.value,
    onChange: props.onChange,
    placeholder: props.placeholder,
    options: props.options
  }), props.note !== undefined && /*#__PURE__*/React.createElement(InputNote, {
    text: props.note
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/Input/input.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/Kpi/kpi.tsx
try { (() => {
/**
 * Kpi — the Cachink "hero big number" primitive.
 *
 * The §8.4 KPI display voice: weight 900, tight letter-spacing, tabular
 * numerals, with a §8.2 uppercase label above and an optional muted hint
 * below. Composes inside a `<Card>` (Director Home, Indicadores). Kpi
 * itself renders only the three text lines — surface, padding, and border
 * are the parent Card's responsibility, mirroring the SectionTitle ↔
 * parent-surface separation.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * `value` is a `string`, not a `Money` or `number`. This keeps Kpi free of
 * domain imports and lets the same primitive render currency, percentages,
 * counts, or any other pre-formatted string. Currency formatting is the
 * `formatMoney(...)` formatter's responsibility (P1A-M3-T03).
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */

const TONE_COLOR = {
  neutral: __ds_scope.colors.black,
  positive: __ds_scope.colors.green,
  negative: __ds_scope.colors.red
};
function Label({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "kpi-label",
    color: __ds_scope.colors.gray600,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 11,
    letterSpacing: __ds_scope.typography.letterSpacing.wide,
    style: {
      textTransform: 'uppercase'
    }
  }, text);
}
function Value({
  text,
  color
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "kpi-value",
    color: color,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.black,
    fontSize: 36,
    letterSpacing: __ds_scope.typography.letterSpacing.tightest,
    marginTop: 6,
    style: {
      fontVariant: ['tabular-nums']
    }
  }, text);
}
function Hint({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "kpi-hint",
    color: __ds_scope.colors.gray400,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.medium,
    fontSize: 13,
    marginTop: 4
  }, text);
}

/**
 * Renders the canonical Cachink KPI block. See `kpi.stories.tsx` for the
 * full variant catalog.
 */
function Kpi(props) {
  const tone = props.tone ?? 'neutral';
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'kpi',
    flexDirection: "column"
  }, /*#__PURE__*/React.createElement(Label, {
    text: props.label
  }), /*#__PURE__*/React.createElement(Value, {
    text: props.value,
    color: TONE_COLOR[tone]
  }), props.hint !== undefined && /*#__PURE__*/React.createElement(Hint, {
    text: props.hint
  }));
}
Object.assign(__ds_scope, { Kpi });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/Kpi/kpi.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/SectionTitle/section-title.tsx
try { (() => {
/**
 * SectionTitle — the Cachink section eyebrow.
 *
 * The typographic marker that announces any grouped block on a screen:
 * "VENTAS HOY", "ACTIVIDAD RECIENTE", "STOCK BAJO", "CUENTAS POR COBRAR".
 * Every Phase 1C screen renders one above every list/card group, so this
 * keeps a single source of truth for the §8.2 Labels voice (weight 700,
 * wide tracking, uppercase, gray600).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * `action` is a `ReactNode` slot — typically a ghost `<Btn>` "Ver todo"
 * or a small "+ Nuevo" primary Btn — so SectionTitle stays decoupled from
 * `<Btn>`'s evolving API (same pattern as EmptyState.action).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented sizes. Transparent background by design: this is content, and
 * the parent view owns the surface.
 */

function Title({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "section-title-text",
    color: __ds_scope.colors.gray600,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 12,
    letterSpacing: __ds_scope.typography.letterSpacing.wide,
    style: {
      textTransform: 'uppercase'
    }
  }, text);
}

/**
 * Renders the canonical Cachink section eyebrow. See
 * `section-title.stories.tsx` for the full variant catalog.
 */
function SectionTitle(props) {
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'section-title',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  }, /*#__PURE__*/React.createElement(Title, {
    text: props.title
  }), props.action !== undefined && /*#__PURE__*/React.createElement(View, {
    testID: "section-title-action",
    alignItems: "center"
  }, props.action));
}
Object.assign(__ds_scope, { SectionTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/SectionTitle/section-title.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/Tag/tag.tsx
try { (() => {
/**
 * Tag — the Cachink pill/label primitive.
 *
 * A small classification chip used across the mock for `categoria`, `metodo`,
 * and other short status labels (see `VentaCard`, egresos list, inventario
 * categoria tag). Display-only — not interactive. A tappable categoria chip
 * would be a different primitive (`<Chip>`) added when a real usage demands.
 *
 * The seven variants map to brand + semantic tokens from CLAUDE.md §8.1 so the
 * prop surface stays disciplined (no raw color props). Every variant ships the
 * same 2px hard border per CLAUDE.md §8.3, overriding the mock's 1.5px default.
 *
 * All visual values come from `../../theme` — no inline hex codes, no invented
 * radii. Label casing is preserved (no `textTransform`) — mock shows proper-
 * cased Spanish categoria strings like `Producto`, `Transferencia`.
 */

const VARIANTS = {
  neutral: {
    background: __ds_scope.colors.gray100,
    color: __ds_scope.colors.black
  },
  brand: {
    background: __ds_scope.colors.yellow,
    color: __ds_scope.colors.black
  },
  soft: {
    background: __ds_scope.colors.yellowSoft,
    color: __ds_scope.colors.black
  },
  success: {
    background: __ds_scope.colors.greenSoft,
    color: __ds_scope.colors.black
  },
  info: {
    background: __ds_scope.colors.blueSoft,
    color: __ds_scope.colors.blue
  },
  danger: {
    background: __ds_scope.colors.redSoft,
    color: __ds_scope.colors.red
  },
  warning: {
    background: __ds_scope.colors.warningSoft,
    color: __ds_scope.colors.black
  }
};

/** Pill radius — 20 from the §8.3 scale, matches the mock's 20. */
const TAG_RADIUS = __ds_scope.radii[6];
function TagText({
  text,
  color
}) {
  return /*#__PURE__*/React.createElement(Text, {
    color: color,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.bold,
    fontSize: 11,
    letterSpacing: __ds_scope.typography.letterSpacing.wide
  }, text);
}

/**
 * Renders a Cachink-branded classification pill. See `tag.stories.tsx` for
 * the full variant matrix.
 */
function Tag(props) {
  const variant = props.variant ?? 'neutral';
  const v = VARIANTS[variant];
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'tag',
    backgroundColor: v.background,
    borderColor: __ds_scope.colors.black,
    borderWidth: 2,
    borderRadius: TAG_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    flexDirection: "row"
  }, /*#__PURE__*/React.createElement(TagText, {
    text: props.children,
    color: v.color
  }));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/Tag/tag.tsx", error: String((e && e.message) || e) }); }

// packages/ui/src/components/TopBar/top-bar.tsx
try { (() => {
/**
 * TopBar — the Cachink sticky-header primitive.
 *
 * Fixed-position top shell rendered on every screen. Holds three slots:
 * `left` (back button, role chip, greeting), a centered title block with
 * optional subtitle, and `right` (settings cog, sync-state chip). The
 * subtitle uses §8.2 body voice; the title uses §8.2 heading voice
 * (weight 900, tight tracking).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop. The
 * mobile shell wraps this in `SafeAreaView`; the desktop shell mounts it
 * directly inside the window chrome.
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */

const HEIGHT = 72;
const SLOT_MIN_WIDTH = 44; // tap-target floor

function Title({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "top-bar-title",
    color: __ds_scope.colors.black,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.black,
    fontSize: 20,
    letterSpacing: __ds_scope.typography.letterSpacing.tight,
    textAlign: "center"
  }, text);
}
function Subtitle({
  text
}) {
  return /*#__PURE__*/React.createElement(Text, {
    testID: "top-bar-subtitle",
    color: __ds_scope.colors.gray600,
    fontFamily: __ds_scope.typography.fontFamily,
    fontWeight: __ds_scope.typography.weights.semibold,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2
  }, text);
}

/**
 * Renders the canonical Cachink sticky top bar. See `top-bar.stories.tsx`
 * for the full variant catalog.
 */
function TopBar(props) {
  return /*#__PURE__*/React.createElement(View, {
    testID: props.testID ?? 'top-bar',
    flexDirection: "row",
    alignItems: "center",
    height: HEIGHT,
    paddingHorizontal: 16,
    backgroundColor: __ds_scope.colors.white,
    borderBottomWidth: 2.5,
    borderBottomColor: __ds_scope.colors.black
  }, /*#__PURE__*/React.createElement(View, {
    testID: "top-bar-left",
    minWidth: SLOT_MIN_WIDTH,
    alignItems: "flex-start",
    justifyContent: "center"
  }, props.left), /*#__PURE__*/React.createElement(View, {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }, props.title !== undefined && /*#__PURE__*/React.createElement(Title, {
    text: props.title
  }), props.subtitle !== undefined && /*#__PURE__*/React.createElement(Subtitle, {
    text: props.subtitle
  })), /*#__PURE__*/React.createElement(View, {
    testID: "top-bar-right",
    minWidth: SLOT_MIN_WIDTH,
    alignItems: "flex-end",
    justifyContent: "center"
  }, props.right));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "packages/ui/src/components/TopBar/top-bar.tsx", error: String((e && e.message) || e) }); }

// tweaks-panel.jsx
try { (() => {
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;height:22px;
    border-radius:6px;cursor:default;padding:0}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const setTweak = React.useCallback((key, val) => {
    setValues(prev => ({
      ...prev,
      [key]: val
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits: {
        [key]: val
      }
    }, '*');
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;

  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}
function TweakColor({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
    type: "color",
    className: "twk-swatch",
    value: value,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cachink_mobile/components/Icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
/* Inline Lucide-style 2.25-stroke icons — matches ICONOGRAPHY section.
   Uses currentColor so parent sets color via CSS. */

const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};
function IconHome({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z"
  }));
}
function IconCoin({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 9c-.5-1.2-1.7-2-3-2-1.7 0-3 1-3 2.3 0 1.2.8 2 3 2.4 2.2.4 3 1.2 3 2.4 0 1.3-1.3 2.3-3 2.3-1.3 0-2.5-.8-3-2M12 6v1.5M12 16.5V18"
  }));
}
function IconReceipt({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 8h8M8 12h8M8 16h5"
  }));
}
function IconBox({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M21 7 12 3 3 7v10l9 4 9-4V7z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 7l9 4 9-4M12 11v10"
  }));
}
function IconChart({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M3 3v18h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 14l4-4 4 4 5-6"
  }));
}
function IconPlus({
  size = 20
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  }));
}
function IconClose({
  size = 20
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6 6 18"
  }));
}
function IconBack({
  size = 20
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M15 6 9 12l6 6"
  }));
}
function IconSettings({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  }));
}
function IconWallet({
  size = 22
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M20 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 10h-5a2 2 0 0 0 0 4h5v-4z"
  }));
}
function IconWifi({
  size = 14
}) {
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  }, iconBase), /*#__PURE__*/React.createElement("path", {
    d: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"
  }));
}
Object.assign(window, {
  IconHome,
  IconCoin,
  IconReceipt,
  IconBox,
  IconChart,
  IconPlus,
  IconClose,
  IconBack,
  IconSettings,
  IconWallet,
  IconWifi
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cachink_mobile/components/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cachink_mobile/components/Primitives.jsx
try { (() => {
/* global React */
/* Cachink Primitives — match packages/ui/src/components/* verbatim.
   Each primitive uses only the CSS vars from ../../colors_and_type.css.
   No platform code; pure DOM for prototype purposes. */

const {
  useState
} = React;

/* ---------- Btn -------------------------------------------------------- */
const BTN_VARIANTS = {
  primary: {
    bg: 'var(--yellow)',
    fg: 'var(--black)',
    shadow: 'var(--shadow-card)'
  },
  dark: {
    bg: 'var(--black)',
    fg: 'var(--white)',
    shadow: 'var(--shadow-card)'
  },
  green: {
    bg: 'var(--green)',
    fg: 'var(--black)',
    shadow: 'var(--shadow-card)'
  },
  danger: {
    bg: 'var(--red)',
    fg: 'var(--white)',
    shadow: 'var(--shadow-card)'
  },
  soft: {
    bg: 'var(--yellow-soft)',
    fg: 'var(--black)',
    shadow: 'var(--shadow-sm)'
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--black)',
    shadow: 'none'
  }
};
const BTN_SIZES = {
  sm: {
    h: 36,
    px: 14,
    fs: 12
  },
  md: {
    h: 44,
    px: 18,
    fs: 13
  },
  lg: {
    h: 52,
    px: 22,
    fs: 15
  }
};
function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled,
  icon,
  fullWidth,
  style
}) {
  const [pressed, setPressed] = useState(false);
  const v = BTN_VARIANTS[variant];
  const s = BTN_SIZES[size];
  const go = () => {
    if (!disabled && onPress) onPress();
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "button",
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
    onClick: go,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: v.bg,
      color: v.fg,
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-10)',
      height: s.h,
      padding: `0 ${s.px}px`,
      fontSize: s.fs,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      boxShadow: pressed && !disabled ? 'var(--shadow-pressed)' : v.shadow,
      transform: pressed && !disabled ? 'translate(2px,2px)' : 'none',
      transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : undefined,
      ...style
    }
  }, icon, children);
}

/* ---------- Card ------------------------------------------------------- */
const CARD_VARIANTS = {
  white: {
    bg: 'var(--white)',
    bw: 2,
    shadow: 'var(--shadow-card)'
  },
  yellow: {
    bg: 'var(--yellow)',
    bw: 2,
    shadow: 'var(--shadow-card)'
  },
  black: {
    bg: 'var(--black)',
    bw: 2.5,
    shadow: 'var(--shadow-hero)'
  }
};
const CARD_PAD = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24
};
function Card({
  variant = 'white',
  padding = 'md',
  onPress,
  children,
  style
}) {
  const [pressed, setPressed] = useState(false);
  const v = CARD_VARIANTS[variant];
  const tap = !!onPress;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: () => tap && setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onClick: onPress,
    style: {
      background: v.bg,
      border: `${v.bw}px solid var(--black)`,
      borderRadius: 'var(--r-14)',
      padding: CARD_PAD[padding],
      boxShadow: tap && pressed ? 'var(--shadow-pressed)' : v.shadow,
      transform: tap && pressed ? 'translate(2px,2px)' : 'none',
      transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
      cursor: tap ? 'pointer' : 'default',
      ...style
    }
  }, children);
}

/* ---------- Tag -------------------------------------------------------- */
const TAG_VARIANTS = {
  neutral: {
    bg: 'var(--gray-100)',
    fg: 'var(--black)'
  },
  brand: {
    bg: 'var(--yellow)',
    fg: 'var(--black)'
  },
  soft: {
    bg: 'var(--yellow-soft)',
    fg: 'var(--black)'
  },
  success: {
    bg: 'var(--green-soft)',
    fg: 'var(--black)'
  },
  info: {
    bg: 'var(--blue-soft)',
    fg: 'var(--blue)'
  },
  danger: {
    bg: 'var(--red-soft)',
    fg: 'var(--red)'
  },
  warning: {
    bg: 'var(--warning-soft)',
    fg: 'var(--black)'
  }
};
function Tag({
  children,
  variant = 'neutral',
  style
}) {
  const v = TAG_VARIANTS[variant];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: v.bg,
      color: v.fg,
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-20)',
      padding: '3px 10px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, children);
}

/* ---------- Input ----------------------------------------------------- */
function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  options,
  note
}) {
  const common = {
    border: 'var(--border-thin)',
    borderRadius: 'var(--r-12)',
    padding: '11px 14px',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--ink)',
    background: 'var(--white)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };
  const useSelect = type === 'select' || Array.isArray(options);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "t-input-label",
    style: {
      display: 'block',
      marginBottom: 5
    }
  }, label), useSelect ? /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value),
    style: common
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Seleccionar..."), (options || []).map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o))) : /*#__PURE__*/React.createElement("input", {
    type: type === 'number' ? 'text' : type,
    inputMode: type === 'number' ? 'decimal' : undefined,
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: placeholder,
    style: common
  }), note && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--gray-400)',
      fontWeight: 500,
      marginTop: 3
    }
  }, note));
}

/* ---------- SectionTitle --------------------------------------------- */
function SectionTitle({
  title,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "t-eyebrow"
  }, title), action);
}

/* ---------- Kpi ------------------------------------------------------- */
const KPI_TONE = {
  neutral: 'var(--black)',
  positive: 'var(--green)',
  negative: 'var(--red)'
};
function Kpi({
  label,
  value,
  hint,
  tone = 'neutral'
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "t-eyebrow"
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 900,
      letterSpacing: '-0.04em',
      color: KPI_TONE[tone],
      marginTop: 6,
      fontVariantNumeric: 'tabular-nums',
      fontFamily: 'var(--font-sans)',
      lineHeight: 1
    }
  }, value), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--gray-400)',
      fontSize: 13,
      fontWeight: 500,
      marginTop: 4
    }
  }, hint));
}

/* ---------- Gauge ----------------------------------------------------- */
const GAUGE_TONE = {
  neutral: 'var(--yellow)',
  positive: 'var(--green)',
  warning: 'var(--warning)',
  negative: 'var(--red)'
};
function Gauge({
  value,
  max = 100,
  label,
  tone = 'neutral',
  showValue = true,
  valueFormatter
}) {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max === 0 ? 0 : clamped / max * 100;
  const fmt = valueFormatter || ((v, m) => m === 100 ? `${v}%` : `${v}/${m}`);
  return /*#__PURE__*/React.createElement("div", null, (label || showValue) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--black)'
    }
  }, label), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--gray-600)'
    }
  }, fmt(clamped, max))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 14,
      background: 'var(--gray-100)',
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-8)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${pct}%`,
      background: GAUGE_TONE[tone],
      transition: 'width 300ms ease'
    }
  })));
}

/* ---------- EmptyState ------------------------------------------------ */
function EmptyState({
  emoji,
  title,
  description,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }
  }, emoji && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 56,
      marginBottom: 16
    }
  }, emoji), /*#__PURE__*/React.createElement("h3", {
    className: "t-title",
    style: {
      margin: 0,
      marginBottom: 6
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "t-muted",
    style: {
      maxWidth: 300,
      margin: 0,
      marginBottom: 20
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, action));
}
Object.assign(window, {
  Btn,
  Card,
  Tag,
  Input,
  SectionTitle,
  Kpi,
  Gauge,
  EmptyState
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cachink_mobile/components/Primitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cachink_mobile/components/Screens.jsx
try { (() => {
/* global React, Btn, Card, Tag, Input, SectionTitle, Kpi, Gauge, EmptyState,
   TopBar, BottomTabBar, SyncChip, FAB, Modal, SparkleBg,
   IconHome, IconCoin, IconReceipt, IconBox, IconChart, IconPlus, IconClose,
   IconBack, IconSettings, IconWallet */

const {
  useState
} = React;
const MXN = n => '$' + n.toLocaleString('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const MXN0 = n => '$' + n.toLocaleString('es-MX', {
  maximumFractionDigits: 0
});

/* ====================================================================
   LOGIN
==================================================================== */
function LoginScreen({
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--white)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 24px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 96,
      borderRadius: 'var(--r-22)',
      background: 'var(--yellow)',
      border: 'var(--border-thick)',
      boxShadow: 'var(--shadow-hero)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icon-padded.png",
    alt: "",
    style: {
      width: 82,
      height: 82,
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo.png",
    alt: "Cachink",
    style: {
      width: 260,
      height: 'auto',
      display: 'block',
      marginLeft: -6
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "t-title",
    style: {
      fontSize: 30,
      marginTop: 20,
      letterSpacing: '-0.04em',
      lineHeight: 1
    }
  }, "Tu caja, clara."), /*#__PURE__*/React.createElement("div", {
    className: "t-muted",
    style: {
      marginTop: 10,
      fontSize: 15,
      maxWidth: 300
    }
  }, "Registra ventas y gastos en segundos. Sin Excel, sin drama.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onPress: () => onPick('operativo')
  }, "Entrar como operativo"), /*#__PURE__*/React.createElement(Btn, {
    variant: "dark",
    size: "lg",
    fullWidth: true,
    onPress: () => onPick('director')
  }, "Entrar como director"), /*#__PURE__*/React.createElement("div", {
    className: "t-caption",
    style: {
      textAlign: 'center',
      marginTop: 8
    }
  }, "v0.3.0 \xB7 Hecho en M\xE9xico")));
}

/* ====================================================================
   LIST ROW (shared)
==================================================================== */
function MovimientoRow({
  icon,
  title,
  subtitle,
  tags,
  amount,
  tone,
  onPress
}) {
  const [p, setP] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onPress,
    onMouseDown: () => onPress && setP(true),
    onMouseUp: () => setP(false),
    onMouseLeave: () => setP(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'var(--white)',
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-14)',
      boxShadow: p ? 'var(--shadow-pressed)' : 'var(--shadow-sm)',
      transform: p ? 'translate(2px,2px)' : 'none',
      transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
      cursor: onPress ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--r-10)',
      background: tone === 'neg' ? 'var(--red-soft)' : 'var(--yellow-soft)',
      border: 'var(--border-thin)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--black)',
      flexShrink: 0
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--black)',
      lineHeight: 1.25
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      flexWrap: 'wrap'
    }
  }, subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--gray-600)',
      fontWeight: 600
    }
  }, subtitle), (tags || []).map((t, i) => /*#__PURE__*/React.createElement(Tag, {
    key: i,
    variant: t.variant,
    style: {
      fontSize: 10,
      padding: '2px 7px'
    }
  }, t.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: tone === 'neg' ? 'var(--red)' : 'var(--green)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, tone === 'neg' ? '−' : '+', MXN(Math.abs(amount))));
}

/* ====================================================================
   OPERATIVO HOME
==================================================================== */
function OperativoHome({
  ventas,
  onNueva,
  tab,
  setTab
}) {
  const ventasHoy = ventas.filter(v => v.tone === 'pos').reduce((s, v) => s + v.amount, 0);
  const egresosHoy = ventas.filter(v => v.tone === 'neg').reduce((s, v) => s + v.amount, 0);
  const netoHoy = ventasHoy - egresosHoy;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "Cachink",
    subtitle: "Panader\xEDa La Esquina",
    left: /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 'var(--r-10)',
        border: 'var(--border-thin)',
        background: 'var(--yellow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        color: 'var(--black)',
        fontSize: 14
      }
    }, "MR"),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'var(--border-thin)',
        borderRadius: 'var(--r-10)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)'
      }
    }, /*#__PURE__*/React.createElement(IconSettings, null))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 16px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--offwhite)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "white",
    padding: "lg",
    style: {
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      background: 'var(--yellow)',
      borderBottom: 'var(--border-thin)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-eyebrow"
  }, "Ventas hoy \xB7 24 abr"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      fontWeight: 900,
      letterSpacing: '-0.045em',
      color: 'var(--black)',
      marginTop: 6,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums'
    }
  }, MXN(ventasHoy)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 14,
      paddingTop: 12,
      borderTop: '2px solid var(--gray-100)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-eyebrow"
  }, "Egresos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      color: 'var(--red)',
      marginTop: 2,
      fontVariantNumeric: 'tabular-nums'
    }
  }, MXN(egresosHoy))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 2,
      background: 'var(--gray-100)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-eyebrow"
  }, "Neto"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      color: 'var(--green)',
      marginTop: 2,
      fontVariantNumeric: 'tabular-nums'
    }
  }, MXN(netoHoy)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "dark",
    size: "md",
    fullWidth: true,
    onPress: onNueva,
    icon: /*#__PURE__*/React.createElement(IconPlus, {
      size: 16
    })
  }, "Venta"), /*#__PURE__*/React.createElement(Btn, {
    variant: "soft",
    size: "md",
    fullWidth: true,
    icon: /*#__PURE__*/React.createElement(IconPlus, {
      size: 16
    })
  }, "Egreso")), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    onPress: () => {}
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 'var(--r-10)',
      background: 'var(--warning-soft)',
      border: 'var(--border-thin)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(IconReceipt, {
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--black)'
    }
  }, "Renta del local"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--gray-600)',
      fontWeight: 600,
      marginTop: 2
    }
  }, "Vence en 3 d\xEDas \xB7 $12,000")), /*#__PURE__*/React.createElement(Tag, {
    variant: "warning"
  }, "Pendiente"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
    title: "Movimientos de hoy",
    action: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--gray-600)'
      }
    }, ventas.length, " TOTAL")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, ventas.length === 0 ? /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    emoji: "\uD83D\uDCED",
    title: "Todav\xEDa no hay ventas",
    description: "Toca + Venta para registrar la primera del d\xEDa.",
    action: /*#__PURE__*/React.createElement(Btn, {
      variant: "primary",
      onPress: onNueva
    }, "Registrar venta")
  })) : ventas.map(v => /*#__PURE__*/React.createElement(MovimientoRow, {
    key: v.id,
    icon: v.tone === 'neg' ? /*#__PURE__*/React.createElement(IconReceipt, {
      size: 18
    }) : /*#__PURE__*/React.createElement(IconCoin, {
      size: 18
    }),
    title: v.concepto,
    subtitle: v.hora,
    tags: [{
      label: v.categoria,
      variant: 'neutral'
    }, {
      label: v.metodo,
      variant: v.metodo === 'Efectivo' ? 'brand' : 'info'
    }],
    amount: v.amount,
    tone: v.tone
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(SyncChip, {
    state: "synced"
  }))), /*#__PURE__*/React.createElement(FAB, {
    onClick: onNueva
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 26
  })), /*#__PURE__*/React.createElement(BottomTabBar, {
    activeKey: tab,
    onChange: setTab,
    items: [{
      key: 'home',
      label: 'Inicio',
      icon: /*#__PURE__*/React.createElement(IconHome, null)
    }, {
      key: 'ventas',
      label: 'Ventas',
      icon: /*#__PURE__*/React.createElement(IconCoin, null)
    }, {
      key: 'corte',
      label: 'Corte',
      icon: /*#__PURE__*/React.createElement(IconWallet, null)
    }, {
      key: 'ajustes',
      label: 'Ajustes',
      icon: /*#__PURE__*/React.createElement(IconSettings, null)
    }]
  }));
}

/* ====================================================================
   NUEVA VENTA MODAL
==================================================================== */
function NuevaVentaModal({
  open,
  onClose,
  onSave
}) {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Producto');
  const [metodo, setMetodo] = useState('Efectivo');
  const save = () => {
    if (!monto || !concepto) return;
    onSave({
      id: Date.now(),
      concepto,
      categoria,
      metodo,
      amount: parseFloat(monto) || 0,
      tone: 'pos',
      hora: 'Ahora'
    });
    setMonto('');
    setConcepto('');
  };
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    onClose: onClose,
    title: "Nueva venta"
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Monto (MXN)",
    type: "number",
    value: monto,
    onChange: setMonto,
    placeholder: "0.00",
    note: "Sin IVA. Se redondea al guardar."
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Concepto",
    value: concepto,
    onChange: setConcepto,
    placeholder: "Ej. Pan dulce \xD7 4"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Categor\xEDa",
    type: "select",
    value: categoria,
    onChange: setCategoria,
    options: ['Producto', 'Servicio', 'Suscripción', 'Otro']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "t-input-label",
    style: {
      display: 'block',
      marginBottom: 6
    }
  }, "M\xE9todo de pago"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, ['Efectivo', 'Transferencia', 'Tarjeta'].map(m => /*#__PURE__*/React.createElement("div", {
    key: m,
    onClick: () => setMetodo(m),
    style: {
      flex: 1,
      textAlign: 'center',
      padding: '11px 0',
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-12)',
      background: metodo === m ? 'var(--yellow)' : 'var(--white)',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      color: 'var(--black)',
      userSelect: 'none',
      boxShadow: metodo === m ? 'var(--shadow-sm)' : 'none'
    }
  }, m)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    fullWidth: true,
    onPress: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    fullWidth: true,
    onPress: save,
    disabled: !monto || !concepto
  }, "Guardar venta")));
}

/* ====================================================================
   DIRECTOR HOME
==================================================================== */
function DirectorHome({
  tab,
  setTab
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: "Direcci\xF3n",
    subtitle: "Panader\xEDa La Esquina \xB7 Abril",
    left: /*#__PURE__*/React.createElement(Tag, {
      variant: "brand"
    }, "DIR"),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'var(--border-thin)',
        borderRadius: 'var(--r-10)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)'
      }
    }, /*#__PURE__*/React.createElement(IconSettings, null))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px 16px 100px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--offwhite)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    variant: "black",
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "t-eyebrow",
    style: {
      color: '#D6D6D2'
    }
  }, "Utilidad neta \xB7 mes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      fontWeight: 900,
      letterSpacing: '-0.045em',
      color: 'var(--white)',
      marginTop: 6,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums'
    }
  }, "$184,320"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    variant: "success"
  }, "+18% vs. marzo"), /*#__PURE__*/React.createElement(Tag, {
    variant: "soft"
  }, "Meta 92%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Ventas mes",
    value: "$486k",
    hint: "+12% vs. marzo",
    tone: "positive"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Egresos",
    value: "$302k",
    hint: "61% de ingresos",
    tone: "neutral"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "CxC",
    value: "$48.3k",
    hint: "4 clientes",
    tone: "neutral"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Efectivo",
    value: "$92.1k",
    hint: "En caja + banco",
    tone: "positive"
  }))), /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    title: "Salud financiera"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Gauge, {
    label: "Margen bruto",
    tone: "positive",
    value: 62
  }), /*#__PURE__*/React.createElement(Gauge, {
    label: "Raz\xF3n de liquidez",
    tone: "warning",
    value: 1.8,
    max: 3,
    valueFormatter: (v, m) => `${v} / ${m}`
  }), /*#__PURE__*/React.createElement(Gauge, {
    label: "Meta del mes",
    tone: "neutral",
    value: 92
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
    title: "Cuentas por cobrar",
    action: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--gray-600)'
      }
    }, "4 CLIENTES")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [{
    name: 'Café del Parque',
    dias: 'Vence en 2 días',
    amount: 8400,
    tone: 'pend'
  }, {
    name: 'Hotel Centro',
    dias: 'Vencida · 5 días',
    amount: 14200,
    tone: 'over'
  }, {
    name: 'Escuela Benavente',
    dias: 'Vence en 12 días',
    amount: 18700,
    tone: 'ok'
  }, {
    name: 'Restaurante Ruta',
    dias: 'Vence hoy',
    amount: 7000,
    tone: 'pend'
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      background: 'var(--white)',
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-14)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--black)'
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: c.tone === 'over' ? 'var(--red)' : 'var(--gray-600)',
      fontWeight: 700,
      marginTop: 3
    }
  }, c.dias)), /*#__PURE__*/React.createElement(Tag, {
    variant: c.tone === 'over' ? 'danger' : c.tone === 'pend' ? 'warning' : 'neutral'
  }, c.tone === 'over' ? 'Vencida' : c.tone === 'pend' ? 'Pendiente' : 'Al día'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 900,
      letterSpacing: '-0.02em',
      color: 'var(--black)',
      fontVariantNumeric: 'tabular-nums',
      minWidth: 72,
      textAlign: 'right'
    }
  }, MXN0(c.amount)))))), /*#__PURE__*/React.createElement(Card, {
    padding: "md",
    style: {
      background: 'var(--warning-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26
    }
  }, "\uD83D\uDCE6"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--black)'
    }
  }, "Inventario bajo \xB7 3 productos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--gray-600)',
      fontWeight: 600,
      marginTop: 2
    }
  }, "Harina, az\xFAcar, levadura por debajo del m\xEDnimo.")), /*#__PURE__*/React.createElement(Btn, {
    variant: "dark",
    size: "sm"
  }, "Ver")))), /*#__PURE__*/React.createElement(BottomTabBar, {
    activeKey: tab,
    onChange: setTab,
    items: [{
      key: 'home',
      label: 'Panel',
      icon: /*#__PURE__*/React.createElement(IconChart, null)
    }, {
      key: 'cxc',
      label: 'CxC',
      icon: /*#__PURE__*/React.createElement(IconWallet, null),
      badge: 4
    }, {
      key: 'stock',
      label: 'Stock',
      icon: /*#__PURE__*/React.createElement(IconBox, null)
    }, {
      key: 'ajustes',
      label: 'Ajustes',
      icon: /*#__PURE__*/React.createElement(IconSettings, null)
    }]
  }));
}
Object.assign(window, {
  LoginScreen,
  OperativoHome,
  NuevaVentaModal,
  DirectorHome,
  MovimientoRow
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cachink_mobile/components/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cachink_mobile/components/Shell.jsx
try { (() => {
/* global React, Tag */

/* ---------- TopBar ---------------------------------------------------- */
function TopBar({
  title,
  subtitle,
  left,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      height: 72,
      padding: '0 16px',
      background: 'var(--white)',
      borderBottom: 'var(--border-thick)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 44,
      display: 'flex',
      alignItems: 'center'
    }
  }, left), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center'
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 900,
      fontSize: 18,
      letterSpacing: '-0.02em',
      color: 'var(--black)',
      fontFamily: 'var(--font-sans)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 12,
      color: 'var(--gray-600)',
      marginTop: 2
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end'
    }
  }, right));
}

/* ---------- SyncChip -------------------------------------------------- */
function SyncChip({
  state = 'local'
}) {
  const map = {
    local: {
      label: 'Solo este dispositivo',
      variant: 'neutral'
    },
    synced: {
      label: 'Sincronizado · 3 disp.',
      variant: 'success'
    },
    offline: {
      label: 'Sin conexión',
      variant: 'warning'
    }
  };
  const s = map[state];
  return /*#__PURE__*/React.createElement(Tag, {
    variant: s.variant
  }, s.label);
}

/* ---------- BottomTabBar --------------------------------------------- */
function BottomTabBar({
  items,
  activeKey,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 68,
      background: 'var(--white)',
      borderTop: 'var(--border-thick)',
      position: 'sticky',
      bottom: 0,
      zIndex: 10
    }
  }, items.map(it => {
    const active = it.key === activeKey;
    return /*#__PURE__*/React.createElement("div", {
      key: it.key,
      onClick: () => onChange(it.key),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'var(--yellow)' : 'transparent',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        color: active ? 'var(--black)' : 'var(--gray-600)',
        gap: 4
      }
    }, it.icon, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-sans)'
      }
    }, it.label), it.badge ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 6,
        right: '28%',
        background: 'var(--red)',
        color: 'var(--white)',
        width: 18,
        height: 18,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700
      }
    }, it.badge) : null);
  }));
}

/* ---------- FAB ------------------------------------------------------- */
function FAB({
  onClick,
  children
}) {
  const [p, setP] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    onMouseLeave: () => setP(false),
    style: {
      position: 'absolute',
      right: 18,
      bottom: 68 + 18,
      zIndex: 5,
      width: 58,
      height: 58,
      borderRadius: '50%',
      background: 'var(--yellow)',
      border: 'var(--border-thick)',
      boxShadow: p ? 'var(--shadow-pressed)' : 'var(--shadow-hero)',
      transform: p ? 'translate(2px,2px)' : 'none',
      transition: 'transform 100ms var(--press-ease), box-shadow 100ms var(--press-ease)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'var(--black)'
    }
  }, children);
}

/* ---------- Modal (bottom-sheet on mobile) --------------------------- */
function Modal({
  open,
  onClose,
  title,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      background: 'rgba(13,13,13,0.45)',
      display: 'flex',
      alignItems: 'flex-end'
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      background: 'var(--white)',
      borderTop: 'var(--border-thick)',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      boxShadow: '0 -5px 0 var(--black)',
      padding: 20,
      paddingBottom: 34,
      maxHeight: '85%',
      overflowY: 'auto',
      animation: 'slideUp 220ms var(--press-ease)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontWeight: 900,
      fontSize: 20,
      letterSpacing: '-0.02em',
      color: 'var(--black)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'var(--border-thin)',
      borderRadius: 'var(--r-10)',
      background: 'var(--white)',
      boxShadow: 'var(--shadow-sm)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(IconClose, null))), children), /*#__PURE__*/React.createElement("style", null, `@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`));
}

/* ---------- SparkleBg (splash backdrop) ------------------------------ */
function SparkleBg({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--yellow)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      top: 70,
      left: 42,
      opacity: 0.95
    },
    width: "26",
    height: "26",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--black)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14.5 9c-.4-1-1.4-1.7-2.5-1.7-1.4 0-2.5.8-2.5 2 0 1 .7 1.6 2.5 2s2.5 1 2.5 2c0 1.2-1.1 2-2.5 2-1.1 0-2.1-.7-2.5-1.7"
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      top: 110,
      right: 38
    },
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "var(--black)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z"
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      top: 180,
      left: 80
    },
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "var(--black)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z"
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      bottom: 120,
      right: 56
    },
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "var(--black)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2z"
  })), children);
}
Object.assign(window, {
  TopBar,
  BottomTabBar,
  SyncChip,
  FAB,
  Modal,
  SparkleBg
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cachink_mobile/components/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/cachink_mobile/ios-frame.jsx
try { (() => {
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports: IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/cachink_mobile/ios-frame.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BottomTabBar = __ds_scope.BottomTabBar;

__ds_ns.TabItem = __ds_scope.TabItem;

__ds_ns.Btn = __ds_scope.Btn;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Gauge = __ds_scope.Gauge;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Kpi = __ds_scope.Kpi;

__ds_ns.SectionTitle = __ds_scope.SectionTitle;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.TopBar = __ds_scope.TopBar;

})();

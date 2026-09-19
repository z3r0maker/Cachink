import { useState } from 'react';
import { Eyebrow, HardBtn } from '../copy.jsx';
import { Reveal, TiltCard } from '../Motion.jsx';
import { useViewport } from '../Viewport.jsx';
import { PLANES, ANUAL_NOTA, signupUrl, totalConIva } from '../planes.js';

/* Interval toggle: monthly vs annual (10× monthly = 2 months free, N-01). */
function IntervalToggle({ interval, onPick }) {
  const base = {
    border: '2px solid var(--black)',
    borderRadius: 12,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        background: 'var(--white)',
        border: '2px solid var(--black)',
        borderRadius: 14,
        boxShadow: '4px 4px 0 var(--black)',
        padding: 6,
        marginBottom: 36,
      }}
    >
      <button
        onClick={() => onPick('mensual')}
        aria-pressed={interval === 'mensual'}
        style={{
          ...base,
          background: interval === 'mensual' ? 'var(--black)' : 'transparent',
          color: interval === 'mensual' ? 'var(--yellow)' : 'var(--black)',
        }}
      >
        Mensual
      </button>
      <button
        onClick={() => onPick('anual')}
        aria-pressed={interval === 'anual'}
        style={{
          ...base,
          background: interval === 'anual' ? 'var(--black)' : 'transparent',
          color: interval === 'anual' ? 'var(--yellow)' : 'var(--black)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        Anual
        <span
          style={{
            background: 'var(--yellow)',
            color: 'var(--black)',
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          2 meses gratis
        </span>
      </button>
    </div>
  );
}

const mxn = (n) =>
  `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/** Money always shows its centavos in the IVA footnote (230.84, 2,308.40). */
const mxn2 = (n) =>
  `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Precios() {
  const { isMobile } = useViewport();
  const [interval, setInterval] = useState('mensual');

  return (
    <section
      id="precios"
      style={{ background: 'var(--offwhite)', borderBottom: '2.5px solid var(--black)' }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: `clamp(48px, 8vw, 80px) clamp(20px, 5vw, 28px)`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Eyebrow>Precios · honestos</Eyebrow>
          <h2
            style={{
              margin: '10px 0 10px',
              fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 52,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--black)',
            }}
          >
            Sin trucos. Sin letra chica.
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'var(--gray-600)',
              fontWeight: 500,
              margin: '0 0 24px',
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Tu negocio sigue aunque se vaya el internet. Prueba 14 días cualquier plan de pago, sin
            tarjeta.
          </p>
          <IntervalToggle interval={interval} onPick={setInterval} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {PLANES.map((t, i) => {
            const precio = t[interval];
            const cad =
              precio === 0 ? '/ para siempre' : interval === 'mensual' ? '/ mes MXN' : '/ año MXN';
            return (
              <Reveal key={t.id} delay={i * 120} from="up">
                <TiltCard max={5} lift={t.featured ? 12 : 6}>
                  <div
                    style={{
                      background: t.featured ? 'var(--yellow)' : 'var(--white)',
                      border: '2.5px solid var(--black)',
                      borderRadius: 20,
                      boxShadow: t.featured ? '8px 8px 0 var(--black)' : '5px 5px 0 var(--black)',
                      padding: 28,
                      position: 'relative',
                      transform: !isMobile && t.featured ? 'translateY(-8px)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {t.featured && (
                      <div
                        style={{
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
                          textTransform: 'uppercase',
                        }}
                      >
                        Recomendado
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--gray-600)',
                      }}
                    >
                      {t.nombre}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--gray-600)',
                        marginTop: 2,
                      }}
                    >
                      {t.tagline}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 6,
                        marginTop: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 48,
                          fontWeight: 900,
                          letterSpacing: '-0.04em',
                          color: 'var(--black)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {mxn(precio)}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-600)' }}>
                        {cad}
                      </div>
                      {precio > 0 && (
                        <div
                          title={`Total con IVA: $${totalConIva(t.id, interval).toLocaleString('es-MX')} MXN`}
                          style={{
                            fontSize: 11,
                            fontWeight: 900,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            background: 'var(--white)',
                            border: '2px solid var(--black)',
                            borderRadius: 8,
                            padding: '3px 8px',
                            color: 'var(--black)',
                          }}
                        >
                          + IVA
                        </div>
                      )}
                    </div>
                    <ul
                      style={{
                        margin: '18px 0 22px',
                        padding: 0,
                        listStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        flex: 1,
                      }}
                    >
                      {t.features.map((f, j) => (
                        <li
                          key={j}
                          style={{
                            display: 'flex',
                            gap: 10,
                            fontSize: 14,
                            color: 'var(--black)',
                            fontWeight: 600,
                          }}
                        >
                          <div
                            style={{
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
                              fontWeight: 900,
                            }}
                          >
                            ✓
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <HardBtn
                      size="sm"
                      variant={t.featured ? 'dark' : 'white'}
                      href={signupUrl(t.id)}
                    >
                      {t.cta}
                    </HardBtn>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--gray-600)',
            fontWeight: 500,
            maxWidth: 720,
            margin: '28px auto 0',
            lineHeight: 1.6,
          }}
        >
          {ANUAL_NOTA} Precios <strong>+ IVA (16 %)</strong>: con IVA incluido Xangarro es{' '}
          {mxn2(totalConIva('xangarro', 'mensual'))} al mes ·{' '}
          {mxn2(totalConIva('xangarro', 'anual'))} al año; Xangarrote es{' '}
          {mxn2(totalConIva('xangarrote', 'mensual'))} al mes ·{' '}
          {mxn2(totalConIva('xangarrote', 'anual'))} al año. Paga con tarjeta de crédito o débito, o
          por transferencia SPEI en plan anual. La exportación de tus datos está incluida en todos
          los planes.
        </p>
      </div>
    </section>
  );
}

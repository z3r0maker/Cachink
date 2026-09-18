import { Eyebrow, HardBtn } from '../copy.jsx';
import { Reveal, TiltCard } from '../Motion.jsx';
import { useViewport } from '../Viewport.jsx';

const tiers = [
  {
    name: 'Gratis',
    price: '$0',
    cad: '/ para siempre',
    features: ['Ventas + egresos ilimitados', '1 dispositivo', 'Corte de día', 'Exportar a CSV'],
    variant: 'white',
    cta: 'Empezar gratis',
  },
  {
    name: 'Pro',
    price: '$149',
    cad: '/ mes MXN',
    features: [
      'Todo lo de Gratis',
      'Multi-dispositivo sincronizado',
      'Panel Director',
      'Estados financieros NIF',
      'Soporte por WhatsApp',
    ],
    variant: 'yellow',
    cta: 'Probar Pro',
    featured: true,
  },
  {
    name: 'Contador',
    price: '$299',
    cad: '/ mes MXN',
    features: [
      'Todo lo de Pro',
      'Hasta 10 negocios',
      'Exportación fiscal',
      'Multi-usuario con permisos',
    ],
    variant: 'white',
    cta: 'Hablar con ventas',
  },
];

export default function Precios() {
  const { isMobile } = useViewport();
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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
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
              margin: 0,
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Precios preliminares para el lanzamiento. Los suscriptores de la lista de espera tendrán
            3 meses gratis en cualquier plan.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {tiers.map((t, i) => (
            <Reveal key={i} delay={i * 120} from="up">
              <TiltCard max={5} lift={t.featured ? 12 : 6}>
                <div
                  style={{
                    background: t.variant === 'yellow' ? 'var(--yellow)' : 'var(--white)',
                    border: '2.5px solid var(--black)',
                    borderRadius: 20,
                    boxShadow: t.featured ? '8px 8px 0 var(--black)' : '5px 5px 0 var(--black)',
                    padding: 28,
                    position: 'relative',
                    transform: !isMobile && t.featured ? 'translateY(-8px)' : 'none',
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
                    {t.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                    <div
                      style={{
                        fontSize: 48,
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        color: 'var(--black)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {t.price}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-600)' }}>
                      {t.cad}
                    </div>
                  </div>
                  <ul
                    style={{
                      margin: '18px 0 22px',
                      padding: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
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
                  <HardBtn size="sm" variant={t.featured ? 'dark' : 'white'}>
                    {t.cta}
                  </HardBtn>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

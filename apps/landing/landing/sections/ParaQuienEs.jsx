import { TONE_COPY, Eyebrow, HardCard } from '../copy.jsx'
import { Reveal, TiltCard } from '../Motion.jsx'
import { useViewport } from '../Viewport.jsx'

const IconBakery = () => (
  <svg viewBox="0 0 56 56" width="40" height="40" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 34 C 6 22, 16 12, 28 12 C 40 12, 50 22, 50 34 C 50 38, 46 40, 42 38 L 36 36 L 28 38 L 20 36 L 14 38 C 10 40, 6 38, 6 34 Z" fill="var(--yellow)" />
    <path d="M14 28 L 20 32" /><path d="M22 22 L 26 30" /><path d="M30 20 L 32 30" />
    <path d="M38 22 L 36 30" /><path d="M44 28 L 40 32" />
    <path d="M20 8 C 20 6, 22 6, 22 4" stroke="var(--gray-600)" strokeWidth="2" />
    <path d="M28 6 C 28 4, 30 4, 30 2" stroke="var(--gray-600)" strokeWidth="2" />
    <path d="M36 8 C 36 6, 38 6, 38 4" stroke="var(--gray-600)" strokeWidth="2" />
  </svg>
)

const IconShop = () => (
  <svg viewBox="0 0 56 56" width="40" height="40" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 14 L 50 14 L 46 22 L 10 22 Z" fill="var(--yellow)" />
    <path d="M16 14 L 14 22 M 26 14 L 26 22 M 36 14 L 38 22" />
    <path d="M10 22 L 10 48 L 46 48 L 46 22" fill="var(--yellow)" />
    <rect x="22" y="32" width="12" height="16" fill="var(--yellow)" />
    <circle cx="31" cy="40" r="0.9" fill="var(--black)" stroke="none" />
    <rect x="13" y="26" width="7" height="6" fill="var(--yellow)" />
    <rect x="36" y="26" width="7" height="6" fill="var(--yellow)" />
    <path d="M4 48 L 52 48" />
    <rect x="23" y="18" width="10" height="3" fill="var(--black)" stroke="none" />
  </svg>
)

const IconToolbox = () => (
  <svg viewBox="0 0 56 56" width="40" height="40" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 26 L 18 16 L 38 16 L 42 26" fill="var(--yellow)" />
    <path d="M28 16 L 28 26" />
    <path d="M6 36 L 8 26 L 48 26 L 50 36 L 50 40 L 6 40 Z" fill="var(--yellow)" />
    <rect x="46" y="30" width="3" height="3" fill="var(--black)" stroke="none" />
    <rect x="7" y="30" width="3" height="3" fill="var(--black)" stroke="none" />
    <circle cx="16" cy="42" r="5" fill="var(--yellow)" />
    <circle cx="16" cy="42" r="1.8" fill="var(--black)" stroke="none" />
    <circle cx="40" cy="42" r="5" fill="var(--yellow)" />
    <circle cx="40" cy="42" r="1.8" fill="var(--black)" stroke="none" />
    <path d="M32 10 L 38 4" strokeWidth="2" />
    <circle cx="31" cy="11" r="2" fill="var(--yellow)" strokeWidth="2" />
  </svg>
)

export default function ParaQuienEs({ tone }) {
  const c = TONE_COPY[tone]
  const { isMobile } = useViewport()
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
            { Icon: IconBakery,  t: 'Panaderías y cafés',    d: 'Decenas de ventas chicas al día. Cachink te lleva el corte del día sin hacer cuentas a mano.' },
            { Icon: IconShop,    t: 'Tiendas de barrio',     d: 'Efectivo, fiado, transferencia. Registras cómo te pagaron y ves qué te deben.' },
            { Icon: IconToolbox, t: 'Talleres y servicios',  d: 'Trabajos chicos con insumos. Cachink separa ingresos de costos y te da la utilidad real.' },
          ].map((x, i) => (
            <Reveal key={i} delay={i * 120} from="up">
              <TiltCard max={5} lift={6}>
                <HardCard padding={24}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--yellow)', border: '2.5px solid var(--black)', boxShadow: '3px 3px 0 var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
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
  )
}

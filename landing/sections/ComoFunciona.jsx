import { TONE_COPY, Eyebrow } from '../copy.jsx'
import { Reveal, TiltCard } from '../Motion.jsx'
import { useViewport } from '../Viewport.jsx'

export default function ComoFunciona({ tone, darkSection }) {
  const c = TONE_COPY[tone]
  const onDark = darkSection
  const { isMobile } = useViewport()
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
                  background: 'var(--white)',
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
  )
}

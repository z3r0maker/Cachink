import { LandingPhoneFrame, OperativoStatic, DirectorStatic, NuevaVentaStatic } from '../PhoneScreens.jsx'
import { Eyebrow } from '../copy.jsx'
import { Reveal, Parallax, TiltCard } from '../Motion.jsx'
import { useViewport } from '../Viewport.jsx'

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
]

export default function Recorrido() {
  const { isMobile, isTablet } = useViewport()
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
  )
}

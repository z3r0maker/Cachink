import { useState } from 'react'
import { Eyebrow, HardCard, FAQ_ITEMS } from '../copy.jsx'
import { Reveal, TiltCard } from '../Motion.jsx'
import { useViewport } from '../Viewport.jsx'

/* ─────────────── FAQ ACCORDION ─────────────── */
function FAQAccordion() {
  const [open, setOpen] = useState(null)
  const { isMobile } = useViewport()
  return (
    <section id="faq" style={{ background: 'var(--white)', borderBottom: '2.5px solid var(--black)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(48px, 8vw, 80px) clamp(20px, 5vw, 28px)` }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <h2 style={{ margin: '10px 0 40px', fontSize: isMobile ? 'clamp(26px, 7vw, 36px)' : 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--black)' }}>
            Todo lo que necesitas saber.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i
              return (
                <div key={i} style={{
                  border: '2px solid var(--black)', borderRadius: 14,
                  boxShadow: isOpen ? '4px 4px 0 var(--black)' : '3px 3px 0 var(--black)',
                  overflow: 'hidden',
                  transition: 'box-shadow 150ms ease',
                }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%', textAlign: 'left', background: isOpen ? 'var(--yellow)' : 'var(--white)',
                      border: 'none', padding: '18px 20px', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                      fontFamily: 'var(--font-sans)', transition: 'background 150ms ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: 'var(--black)', lineHeight: 1.3 }}>
                      {item.q}
                    </span>
                    <span style={{
                      fontSize: 18, fontWeight: 900, color: 'var(--black)', flexShrink: 0,
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform 200ms ease',
                      display: 'inline-block',
                    }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 20px 20px',
                      fontSize: isMobile ? 14 : 15,
                      color: 'var(--ink)', fontWeight: 500, lineHeight: 1.65,
                      background: 'var(--yellow)',
                      borderTop: '2px solid var(--black)',
                    }}>
                      <p style={{ margin: '16px 0 0' }}>{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── CONTACTO ─────────────── */
function Contacto({ darkSection }) {
  const { isMobile } = useViewport()
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
  )
}

/* ─────────────── FOOTER ─────────────── */
const SocialIG = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)
const SocialTikTok = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19.5 7.2a6.6 6.6 0 0 1-3.9-1.3v8.6a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a2.9 2.9 0 1 0 2 2.8V2h3a3.6 3.6 0 0 0 3.9 3.6v1.6Z" />
  </svg>
)
const SocialX = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.4L4.8 21H1.6l7.5-8.6L1.2 3h6.6l4.5 6 5.2-6Zm-1.1 16.2h1.8L7.7 4.7H5.8l10.6 14.5Z" />
  </svg>
)
const SocialYouTube = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M21.8 7.5a2.5 2.5 0 0 0-1.8-1.8C18.4 5.3 12 5.3 12 5.3s-6.4 0-8 .4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 1.8 12a26 26 0 0 0 .4 4.5 2.5 2.5 0 0 0 1.8 1.8c1.6.4 8 .4 8 .4s6.4 0 8-.4a2.5 2.5 0 0 0 1.8-1.8 26 26 0 0 0 .4-4.5 26 26 0 0 0-.4-4.5ZM10 15.2V8.8L15.5 12 10 15.2Z" />
  </svg>
)

const SOCIALS = [
  { k: 'ig', Icon: SocialIG,      label: 'Instagram', href: 'https://instagram.com/cachink' },
  { k: 'tt', Icon: SocialTikTok,  label: 'TikTok',    href: 'https://tiktok.com/@cachink' },
  { k: 'x',  Icon: SocialX,       label: 'X',         href: 'https://x.com/cachink' },
  { k: 'yt', Icon: SocialYouTube, label: 'YouTube',   href: 'https://youtube.com/@cachink' },
]

function SocialButton({ Icon, label, href }) {
  const [h, setH] = useState(false)
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
  )
}

function Footer() {
  const { isMobile } = useViewport()
  return (
    <footer style={{ background: 'var(--white)', color: 'var(--black)', borderTop: '2.5px solid var(--black)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `clamp(36px, 6vw, 48px) clamp(20px, 5vw, 28px) clamp(24px, 4vw, 36px)` }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          gap: isMobile ? 24 : 40, alignItems: 'center',
          paddingBottom: 28,
          borderBottom: '2px solid var(--black)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Use apple-touch-icon — logo.png is a 2 MB file, never ship it */}
            <img src="/assets/apple-touch-icon.png" alt="Cachink" width="56" height="56" style={{ height: 56, width: 'auto', alignSelf: 'flex-start' }} />
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
  )
}

/* Default export: FAQ accordion + Contacto + Footer as one lazy chunk */
export default function ContactoFooter({ darkSection }) {
  return (
    <>
      <FAQAccordion />
      <Contacto darkSection={darkSection} />
      <Footer />
    </>
  )
}

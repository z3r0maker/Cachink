import { MotionProvider } from '../landing/Motion.jsx'
import {
  Nav,
  Hero,
  ParaQuienEs,
  ComoFunciona,
  Recorrido,
  Precios,
  Contacto,
  Footer,
} from '../landing/Sections.jsx'
import { structuredData } from './structured-data.js'

// Matches the production tweak defaults from the original index.html.
// All knobs are locked at their final values — no live panel in production.
const T = {
  tone: 'educational',
  yellowIntensity: 'medium',
  darkComoSection: false,
  darkContactSection: false,
  showPricing: true,
  motion: true,
}

export default function App() {
  function scrollToTop() {
    const el = document.getElementById('top')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <MotionProvider enabled={T.motion}>
      <div>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Nav onWaitlist={scrollToTop} />
        <Hero tone={T.tone} yellowIntensity={T.yellowIntensity} />
        <ParaQuienEs tone={T.tone} />
        <ComoFunciona tone={T.tone} darkSection={T.darkComoSection} />
        <Recorrido />
        {T.showPricing && <Precios />}
        <Contacto darkSection={T.darkContactSection} />
        <Footer />
      </div>
    </MotionProvider>
  )
}

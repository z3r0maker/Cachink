import { Suspense, lazy, useEffect } from 'react';
import { MotionProvider } from '../landing/Motion.jsx';
import { Nav, Hero } from '../landing/Sections.jsx';
import { structuredData } from './structured-data.js';
import { SIGNUP_BASE } from '../landing/planes.js';

// Below-fold sections: lazy-loaded on the client so the initial JS chunk
// only includes Nav + Hero + their direct dependencies (AnimatedHero, Motion).
// On the server (entry-server.jsx) these are imported eagerly so prerender
// renders full HTML for crawlers — see src/AppSSR.jsx.
const ParaQuienEs = lazy(() => import('../landing/sections/ParaQuienEs.jsx'));
const ComoFunciona = lazy(() => import('../landing/sections/ComoFunciona.jsx'));
const Recorrido = lazy(() => import('../landing/sections/Recorrido.jsx'));
const Precios = lazy(() => import('../landing/sections/Precios.jsx'));
const ContactoFooter = lazy(() => import('../landing/sections/ContactoFooter.jsx'));

// Matches the production tweak defaults from the original index.html.
const T = {
  tone: 'educational',
  yellowIntensity: 'medium',
  darkComoSection: false,
  darkContactSection: false,
  showPricing: true,
  motion: true,
};

export default function App() {
  // L-03: utm_* params from the landing URL travel along to every signup CTA.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = new URLSearchParams();
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const value = params.get(key);
      if (value) utm.set(key, value);
    }
    if ([...utm.keys()].length === 0) return;
    for (const a of document.querySelectorAll(`a[href^="${SIGNUP_BASE}"]`)) {
      const url = new URL(a.href);
      for (const [k, v] of utm) url.searchParams.set(k, v);
      a.href = url.toString();
    }
  }, []);

  return (
    <MotionProvider enabled={T.motion}>
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Nav />
        <Hero tone={T.tone} yellowIntensity={T.yellowIntensity} />

        {/* Below-fold sections load after the hero is interactive */}
        <Suspense fallback={null}>
          <ParaQuienEs tone={T.tone} />
        </Suspense>
        <Suspense fallback={null}>
          <ComoFunciona tone={T.tone} darkSection={T.darkComoSection} />
        </Suspense>
        <Suspense fallback={null}>
          <Recorrido />
        </Suspense>
        {T.showPricing && (
          <Suspense fallback={null}>
            <Precios />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <ContactoFooter darkSection={T.darkContactSection} />
        </Suspense>
      </div>
    </MotionProvider>
  );
}

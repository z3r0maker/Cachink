/**
 * AppSSR.jsx — Server-side rendering entry.
 *
 * Imports all pages and sections eagerly (no React.lazy) so renderToString
 * emits full HTML for every route. Used exclusively by entry-server.jsx.
 * The client bundle uses main.jsx with per-route dynamic imports instead.
 */
import { MotionProvider } from '../landing/Motion.jsx';
import { Nav, Hero } from '../landing/Sections.jsx';
import ParaQuienEs from '../landing/sections/ParaQuienEs.jsx';
import ComoFunciona from '../landing/sections/ComoFunciona.jsx';
import Recorrido from '../landing/sections/Recorrido.jsx';
import Precios from '../landing/sections/Precios.jsx';
import ContactoFooter from '../landing/sections/ContactoFooter.jsx';
import { structuredData } from './structured-data.js';

// Content pages
import Recursos from './pages/Recursos.jsx';
import SinExcel from './pages/articles/SinExcel.jsx';
import NIF from './pages/articles/NIF.jsx';
import ErroresCaja from './pages/articles/ErroresCaja.jsx';
import VsExcel from './pages/articles/VsExcel.jsx';
import Privacidad from './pages/legal/Privacidad.jsx';
import Arco from './pages/legal/Arco.jsx';

const T = {
  tone: 'educational',
  yellowIntensity: 'medium',
  darkComoSection: false,
  darkContactSection: false,
  showPricing: true,
  motion: true,
};

function HomePage() {
  return (
    <MotionProvider enabled={T.motion}>
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Nav />
        <Hero tone={T.tone} yellowIntensity={T.yellowIntensity} />
        <ParaQuienEs tone={T.tone} />
        <ComoFunciona tone={T.tone} darkSection={T.darkComoSection} />
        <Recorrido />
        {T.showPricing && <Precios />}
        <ContactoFooter darkSection={T.darkContactSection} />
      </div>
    </MotionProvider>
  );
}

/**
 * @param {{ route?: string }} props
 *   route — the pathname to render (e.g. '/recursos/sin-excel/').
 *   Defaults to '/' (the home / landing page).
 */
export default function AppSSR({ route = '/' }) {
  const clean = route.replace(/\/$/, '') || '/';

  if (clean === '/recursos/sin-excel') return <SinExcel />;
  if (clean === '/recursos/nif') return <NIF />;
  if (clean === '/recursos/errores-caja') return <ErroresCaja />;
  if (clean === '/recursos/vs-excel') return <VsExcel />;
  if (clean === '/recursos') return <Recursos />;
  if (clean === '/privacidad') return <Privacidad />;
  if (clean === '/privacidad/arco') return <Arco />;

  return <HomePage />;
}

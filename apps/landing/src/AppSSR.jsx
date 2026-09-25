/**
 * AppSSR.jsx — Server-side rendering entry.
 *
 * Imports all pages and sections eagerly (no React.lazy) so renderToString
 * emits full HTML for every route. Used exclusively by entry-server.jsx.
 * The client bundle uses main.jsx with per-route dynamic imports instead.
 */
import { HomeShell } from '../home/HomeShell.jsx';
import BelowFold from '../home/BelowFold.jsx';

// Content pages
import Recursos from './pages/Recursos.jsx';
import SinExcel from './pages/articles/SinExcel.jsx';
import NIF from './pages/articles/NIF.jsx';
import ErroresCaja from './pages/articles/ErroresCaja.jsx';
import VsExcel from './pages/articles/VsExcel.jsx';
import Privacidad from './pages/legal/Privacidad.jsx';
import Arco from './pages/legal/Arco.jsx';
import Terminos from './pages/legal/Terminos.jsx';
import NotFound from './pages/NotFound.jsx';
import Acerca from './pages/Acerca.jsx';

function HomePage() {
  return (
    <HomeShell>
      <BelowFold />
    </HomeShell>
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
  if (clean === '/terminos') return <Terminos />;
  if (clean === '/acerca') return <Acerca />;
  if (clean === '/404') return <NotFound />;

  return <HomePage />;
}

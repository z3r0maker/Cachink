import { createRoot } from 'react-dom/client';
import '../colors_and_type.css';
import './global.css';
import '../home/home.css';
import { UtmPassthrough } from './utm.jsx';

/**
 * Client-side entry point. Switches on pathname so each article page
 * is a separate lazy chunk — only the matched page's JS is downloaded.
 *
 * The server-side equivalent (AppSSR.jsx / entry-server.jsx) handles
 * all routes eagerly so prerender emits full HTML for crawlers.
 */
async function mountApp() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  let Component;

  if (path === '/recursos/sin-excel') {
    Component = (await import('./pages/articles/SinExcel.jsx')).default;
  } else if (path === '/recursos/nif') {
    Component = (await import('./pages/articles/NIF.jsx')).default;
  } else if (path === '/recursos/errores-caja') {
    Component = (await import('./pages/articles/ErroresCaja.jsx')).default;
  } else if (path === '/recursos/vs-excel') {
    Component = (await import('./pages/articles/VsExcel.jsx')).default;
  } else if (path === '/privacidad') {
    Component = (await import('./pages/legal/Privacidad.jsx')).default;
  } else if (path === '/privacidad/arco') {
    Component = (await import('./pages/legal/Arco.jsx')).default;
  } else if (path === '/recursos') {
    Component = (await import('./pages/Recursos.jsx')).default;
  } else if (path === '/') {
    // Home / landing page (with lazy below-fold sections)
    Component = (await import('./App.jsx')).default;
  } else {
    // Anything else is served as dist/404.html; hydrate it as such, not as the home.
    Component = (await import('./pages/NotFound.jsx')).default;
  }

  // UtmPassthrough wraps every route, not just the home page (N-57).
  createRoot(document.getElementById('root')).render(
    <UtmPassthrough>
      <Component />
    </UtmPassthrough>,
  );
}

mountApp();

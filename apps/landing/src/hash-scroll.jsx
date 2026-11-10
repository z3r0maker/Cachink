import { useEffect } from 'react';

/**
 * Opens a `#fragment` link where it points. The browser jumps to the anchor in
 * the prerendered HTML, but the client then mounts the page afresh (main.jsx
 * renders, it does not hydrate), which replaces that DOM and leaves the page
 * at the top. Google Play's account-deletion link is
 * `xangarro.mx/soporte/#eliminar-tu-cuenta` (ADR-136), so the jump is redone
 * once React has committed the page.
 */
export function HashScroll({ children }) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);

  return children;
}

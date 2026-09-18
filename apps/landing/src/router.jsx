/**
 * Minimal client-side router — no dependency on react-router.
 * Switches on location.pathname and handles browser back/forward.
 * Each route is also pre-rendered to its own dist/<route>/index.html
 * by scripts/prerender.mjs, so every URL is a real static HTML file.
 */
import { useState, useEffect } from 'react';

export function useRoute() {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    function onPop() {
      setPath(window.location.pathname);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return path;
}

export function navigate(to) {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

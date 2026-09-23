import { useEffect } from 'react';

import { SIGNUP_BASE } from '../landing/planes.js';

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

/**
 * L-03 / N-57: `utm_*` params from the landing URL travel along to every
 * signup CTA, so the portal can record which campaign brought a business.
 *
 * This used to live in `App.jsx`, which is only the home page — every
 * `/recursos` article dropped its UTMs, leaving content marketing entirely
 * unattributed. Wrapping the mounted component instead means the effect runs
 * once per route, after React has committed the DOM the links live in.
 */
export function UtmPassthrough({ children }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = new URLSearchParams();
    for (const key of KEYS) {
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

  return children;
}

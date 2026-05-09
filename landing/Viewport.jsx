/* Viewport — responsive hook for the Cachink landing page.
   Exposes isMobile (<768px), isTablet (768–1023px), isDesktop (>=1024px).
   SSR-safe: defaults to desktop (1280px) on server, updates after mount. */

import { useState, useEffect } from 'react'

// SSR-safe default: always desktop width so the server render is stable and
// hydration mismatches are avoided. The useEffect below updates to the real
// viewport width on the client after first mount.
const SSR_DEFAULT = { isMobile: false, isTablet: false, isDesktop: true, width: 1280 }

function useViewport() {
  const [vp, setVp] = useState(SSR_DEFAULT)

  useEffect(() => {
    function measure() {
      const w = window.innerWidth
      setVp({
        isMobile:  w < 768,
        isTablet:  w >= 768 && w < 1024,
        isDesktop: w >= 1024,
        width: w,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return vp
}

export { useViewport }

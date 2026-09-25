import { useEffect, useRef } from 'react';

/**
 * Marks a section as on-screen (data-inview="true") so its animations run
 * only while someone can see them; motion.css pauses them otherwise. The
 * paused frame is a finished-looking one, so no-JS and prerendered HTML read fine.
 */
export function useInView() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => el.setAttribute('data-inview', entry.isIntersecting ? 'true' : 'false'),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

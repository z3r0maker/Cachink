import type { MetadataRoute } from 'next';

/**
 * The portal is an application, not a site to index: everything behind the
 * front door redirects a crawler to /login, and the marketing pages live on
 * xangarro.mx. Only the two public entry points are worth a crawler's time.
 * The `allow` entries are longer than the `disallow`, so Google and Bing
 * give them precedence.
 */
export const PUBLIC_PATHS = ['/login', '/signup'] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: [...PUBLIC_PATHS], disallow: '/' }],
  };
}

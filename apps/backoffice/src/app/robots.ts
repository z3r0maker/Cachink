import type { MetadataRoute } from 'next';

/** Nothing on the internal console is for crawlers. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}

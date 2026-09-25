import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { colors } from '@xangarro/tokens';

import { anton, jakarta } from './fonts';
import '../styles/global.css';

/**
 * Internal console (ADR-063). `robots` here is the metadata half of noindex;
 * the `X-Robots-Tag` header (next.config.mjs) and `robots.ts` are the others.
 */
export const metadata: Metadata = {
  title: 'Consola · Xangarro!',
  description: 'Consola interna del equipo de Xangarro.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  referrer: 'no-referrer',
};

export const viewport: Viewport = { themeColor: colors.yellow };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The CSP nonce is per request, so nothing here may be statically rendered.
  await connection();
  return (
    <html lang="es-MX" className={`${jakarta.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}

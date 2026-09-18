import type { Metadata, Viewport } from 'next';
import { colors } from '@xangarro/tokens';

import { anton, jakarta } from './fonts';
import '../styles/global.css';

export const metadata: Metadata = {
  title: 'Xangarro!',
  description: 'Finanzas para emprendedores.',
};

export const viewport: Viewport = {
  themeColor: colors.yellow,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${jakarta.variable} ${anton.variable}`}>
      <body>{children}</body>
    </html>
  );
}

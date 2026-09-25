import { Anton, Plus_Jakarta_Sans } from 'next/font/google';

/**
 * Both typefaces are self-hosted: `next/font` downloads them at build time and
 * serves them from our own origin, so production never calls
 * `fonts.googleapis.com` the way the design prototypes do.
 *
 * **800 is the maximum weight.** The design system asks for 900 headings but
 * Google Fonts tops out at 800, so a 900 request renders as synthetic bold and
 * differs between engines. Every prototype uses 800 (ADR-058 §8).
 */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

/** Anton is for the wordmark only. It must not spread to UI text. */
export const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-anton',
});

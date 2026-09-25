/**
 * Image imports (`import x from './foo.webp'`) are typed by Next's global
 * image types, which `next-env.d.ts` references — and that file is
 * generated and gitignored, so a typecheck before any build (CI) never sees
 * it. This tracked reference carries the same types everywhere.
 */
/// <reference types="next/image-types/global" />

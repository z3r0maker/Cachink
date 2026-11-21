/**
 * The third-party notices in the app bundle. MIT, BSD and Apache ask for
 * their notice in every copy of the software, not for a screen, so the owner
 * chose a file nobody has to open (2026-11-20). `pnpm notices` writes it from
 * the app's production tree, and `scripts/third-party-notices.test.ts` fails
 * when it goes stale. Importing it is what makes Metro copy it into the build.
 */
import avisos from '../../assets/legal/avisos-de-terceros.txt';

/** The bundled asset's id. Nothing reads it; the import is the point. */
export const AVISOS_DE_TERCEROS: number = avisos;

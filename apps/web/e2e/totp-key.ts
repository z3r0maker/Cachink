/**
 * The suite's only TOTP sealing key (N-83): thirty-two zero bytes, base64. A
 * key that is plainly not a key, and never a fallback: the portal has no
 * default for `PORTAL_TOTP_KEY`.
 *
 * One constant for both sides of the run: `playwright.config.ts` hands it to
 * the Next server, and `segundo-factor.ts` seals a fixture's seed with it, so
 * the server can open what the fixture wrote.
 */
export const E2E_TOTP_KEY = process.env.PORTAL_TOTP_KEY ?? Buffer.alloc(32).toString('base64');

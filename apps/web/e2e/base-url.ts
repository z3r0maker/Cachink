/**
 * Where the suite's server listens. `E2E_PORT` moves it off 3100 when a
 * `pnpm dev` already holds that port: locally Playwright reuses whatever
 * answers there, and a dev server without `DATABASE_URL` signs the owner in
 * and then renders "Algo salió mal" on every page.
 */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const BASE_URL = `http://localhost:${E2E_PORT}`;

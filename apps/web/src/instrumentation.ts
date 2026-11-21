import type { Instrumentation } from 'next';

/**
 * Next's server hooks (B-18). Sentry starts once per server, Node only —
 * the dynamic import keeps it out of any edge bundle. `onRequestError` catches
 * what no route or action caught itself, and keeps the event it reported with
 * the session whose request failed, so a report from Ayuda can name it (P-48).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { initSentry } = await import('./server/observability/sentry');
  initSentry();
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { reportError } = await import('./server/observability/report');
  const eventId = reportError(error, { endpoint: `${context.routeType}:${context.routePath}` });
  if (eventId === undefined) return;
  const { keepLastErrorFor, tokenFromCookieHeader } =
    await import('./server/observability/last-error');
  await keepLastErrorFor(tokenFromCookieHeader(request.headers.cookie), eventId);
};

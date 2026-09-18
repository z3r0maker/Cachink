import type { Instrumentation } from 'next';

/**
 * Next's server hooks (B-18). Sentry starts once per server, Node only —
 * the dynamic import keeps it out of any edge bundle. `onRequestError` catches
 * what no route or action caught itself.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { initSentry } = await import('./server/observability/sentry');
  initSentry();
}

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { reportError } = await import('./server/observability/report');
  reportError(error, { endpoint: `${context.routeType}:${context.routePath}` });
};

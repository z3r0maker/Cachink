/**
 * Stands in for `server-only` under Vitest.
 *
 * The real package throws on import outside a React Server environment, which
 * is exactly its job in the app and exactly wrong in a unit test of pure logic.
 * Aliased here rather than removed from the source, so the production guard —
 * a client import of a server module fails the build — stays in place.
 */
export {};

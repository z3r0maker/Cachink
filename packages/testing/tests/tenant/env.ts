/**
 * Runs `fn` with some environment variables replaced, and puts them back
 * whatever happens. `undefined` removes a variable for the duration.
 */
export async function withEnv<T>(
  vars: Readonly<Record<string, string | undefined>>,
  fn: () => Promise<T>,
): Promise<T> {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  const apply = (from: Readonly<Record<string, string | undefined>>) => {
    for (const [k, v] of Object.entries(from)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
  apply(vars);
  try {
    return await fn();
  } finally {
    apply(saved);
  }
}

/** A Postgres URL nothing listens on: the connection is refused at once. */
export const UNREACHABLE = 'postgres://nobody:nobody@127.0.0.1:1/nothing';

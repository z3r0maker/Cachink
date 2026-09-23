import type { AttributionRange, AttributionSource, AttributionTally } from './port';

/** In-memory adapter for the use-case tests. */
export class InMemoryAttribution implements AttributionSource {
  constructor(private readonly tallies: readonly AttributionTally[] = []) {}

  rollup(_range: AttributionRange): Promise<AttributionTally[]> {
    return Promise.resolve([...this.tallies]);
  }
}

export const failingAttribution: AttributionSource = {
  rollup: () => Promise.reject(new Error('no database')),
};

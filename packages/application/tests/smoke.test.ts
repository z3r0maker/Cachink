import { describe, it, expect } from 'vitest';
import { __version__ } from '../src/index.js';

describe('@cachink/application', () => {
  it('package is initialized', () => {
    expect(__version__).toBe('0.0.0');
  });
});

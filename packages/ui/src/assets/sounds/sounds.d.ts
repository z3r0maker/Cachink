/**
 * Type declaration for audio asset imports.
 *
 * Metro resolves `.mp3` imports to a numeric asset ID (require-style).
 * This declaration tells TypeScript the shape so
 * `import cachinkSfx from './cachink.mp3'` compiles without error.
 */
declare module '*.mp3' {
  const src: number;
  export default src;
}

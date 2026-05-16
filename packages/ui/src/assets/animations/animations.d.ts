/**
 * Type declaration for Lottie JSON animation files.
 *
 * Metro and Webpack resolve `.json` imports as modules; this declaration
 * tells TypeScript the shape so `import coinSpin from './coin-spin.json'`
 * compiles without error.
 */
declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}

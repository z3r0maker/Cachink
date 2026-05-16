/**
 * Type declarations for image asset imports.
 *
 * Metro (React Native) resolves `import foo from '*.png'` to a numeric
 * asset ID; Vite (desktop/web) resolves it to a URL string. Both are
 * valid `ImageSourcePropType` values for React Native's `<Image>`.
 * This declaration satisfies TypeScript without coupling to either bundler.
 */

declare module '*.png' {
  const value: number;
  export default value;
}

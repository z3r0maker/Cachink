/**
 * Metro resolves an asset import to its numeric id. `.txt` is an asset here
 * only for the third-party notices (`metro.config.js`).
 */
declare module '*.txt' {
  const value: number;
  export default value;
}

import { renderToString } from 'react-dom/server';
import AppSSR from './AppSSR.jsx';

// The llms files read FAQ_ITEMS from a .jsx module, so they are built through
// this bundle too and scripts/prerender.mjs writes them beside the HTML.
export { buildLlmsTxt } from './llms/short.js';
export { buildLlmsFullTxt } from './llms/full.js';
export { FAQ_ITEMS } from '../landing/copy.jsx';

/**
 * @param {string} [route='/'] — pathname to render, e.g. '/recursos/sin-excel/'
 * @returns {string} HTML string
 */
export function render(route = '/') {
  return renderToString(<AppSSR route={route} />);
}

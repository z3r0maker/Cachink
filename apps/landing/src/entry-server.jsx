import { renderToString } from 'react-dom/server';
import AppSSR from './AppSSR.jsx';

/**
 * @param {string} [route='/'] — pathname to render, e.g. '/recursos/sin-excel/'
 * @returns {string} HTML string
 */
export function render(route = '/') {
  return renderToString(<AppSSR route={route} />);
}

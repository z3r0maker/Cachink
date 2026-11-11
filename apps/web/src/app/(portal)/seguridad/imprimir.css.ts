import { globalStyle, style } from '@vanilla-extract/css';

/**
 * «Imprimir» on the recovery codes (board SgActivar). The codes sit in a side
 * panel over the page, so a plain `window.print()` would print the page behind
 * them. While the print dialog is up, the body carries `data-imprime` and the
 * sheet shows the list alone. Nothing here applies to any other print.
 */
export const IMPRIME = 'imprime';

export const zonaDeImpresion = style({});

const AL_IMPRIMIR = `body[data-${IMPRIME}='codigos']`;

globalStyle(`${AL_IMPRIMIR} *`, { '@media': { print: { visibility: 'hidden' } } });
globalStyle(`${AL_IMPRIMIR} ${zonaDeImpresion}, ${AL_IMPRIMIR} ${zonaDeImpresion} *`, {
  '@media': { print: { visibility: 'visible' } },
});
globalStyle(`${AL_IMPRIMIR} ${zonaDeImpresion}`, {
  '@media': { print: { position: 'fixed', inset: 0, margin: 'auto' } },
});

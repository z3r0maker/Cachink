/**
 * The page half of the seeded bugs (S-12): a script the runner adds before the
 * app's own (and runs once on the page already open), which keeps acting on
 * whatever React renders afterwards. It is JavaScript text, not TypeScript,
 * because it runs inside the page, where nothing of this package exists.
 * Buttons are found by their own first words, as a person reads them.
 */
export type PageMutation =
  /** The button ignores the first click it gets. */
  | { readonly kind: 'first-click'; readonly button: string }
  /** The button's own words become others. */
  | { readonly kind: 'relabel'; readonly from: string; readonly to: string }
  /** The amount after a «Total» label is off by `centavos`. */
  | { readonly kind: 'total-off'; readonly centavos: number }
  /** A sentence anywhere on screen is replaced by another. */
  | { readonly kind: 'translate'; readonly from: string; readonly to: string }
  /** The button is pushed past the viewport's right edge at `maxWidth` or less. */
  | { readonly kind: 'off-screen'; readonly button: string; readonly maxWidth: number };

/** Runs in the page: `M` is the mutation, as JSON. */
const RUNTIME = String.raw`
const ownWords = (el) => {
  const t = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim() !== '');
  return t ? t.textContent.trim() : '';
};
const buttons = (words) =>
  [...document.querySelectorAll('button')].filter((b) => ownWords(b) === words);
const money = (s) => {
  const m = /^\$([\d,]+)\.(\d{2})$/.exec(s.trim());
  return m ? Number(m[1].replace(/,/g, '')) * 100 + Number(m[2]) : null;
};
const pesos = (c) =>
  '$' + Math.floor(c / 100).toLocaleString('en-US') + '.' + String(c % 100).padStart(2, '0');
const written = new WeakMap();
const apply = {
  'first-click': () => {
    if (window.__sembradoClick) return;
    window.__sembradoClick = new WeakSet();
    document.addEventListener('click', (e) => {
      const b = e.target instanceof Element ? e.target.closest('button') : null;
      if (!b || ownWords(b) !== M.button || window.__sembradoClick.has(b)) return;
      window.__sembradoClick.add(b);
      e.stopImmediatePropagation();
      e.preventDefault();
    }, true);
  },
  relabel: () => {
    for (const b of buttons(M.from)) {
      const t = [...b.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim() === M.from);
      if (t) t.textContent = M.to;
    }
  },
  'total-off': () => {
    for (const label of document.querySelectorAll('span, div, p')) {
      if (label.textContent.trim() !== 'Total') continue;
      const v = label.nextElementSibling;
      if (!v || written.get(v) === v.textContent) continue;
      const c = money(v.textContent);
      if (c === null || c === 0) continue;
      v.textContent = pesos(c + M.centavos);
      written.set(v, v.textContent);
    }
  },
  translate: () => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (n.textContent.includes(M.from)) n.textContent = n.textContent.replace(M.from, M.to);
    }
  },
  'off-screen': () => {
    if (!document.getElementById('sembrado-css')) {
      const s = document.createElement('style');
      s.id = 'sembrado-css';
      s.textContent = '@media (max-width: ' + M.maxWidth + 'px) { [data-sembrado] {' +
        ' position: fixed !important; left: calc(100vw + 40px) !important; } }';
      document.head.append(s);
    }
    for (const b of buttons(M.button)) b.setAttribute('data-sembrado', '');
  },
};
const run = () => document.body && apply[M.kind]();
const start = () => {
  run();
  new MutationObserver(run).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true,
  });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
`;

export function pageScript(m: PageMutation): string {
  return `(() => {\nconst M = ${JSON.stringify(m)};\n${RUNTIME}\n})();`;
}

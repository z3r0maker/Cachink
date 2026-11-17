/** The prerender's placeholder guard (O-17): a live legal page publishes no `[GAP]`. */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { placeholdersIn } from '../apps/landing/scripts/placeholders.mjs';

describe('placeholdersIn', () => {
  it('finds the gaps left in the visible text', () => {
    const html = '<p>Escribe a [CORREO PRIVACIDAD] en [24] horas, [PAÍS / REGIÓN].</p>';
    assert.deepEqual(placeholdersIn(html), ['[CORREO PRIVACIDAD]', '[24]', '[PAÍS / REGIÓN]']);
  });

  it('leaves a link text alone', () => {
    assert.deepEqual(placeholdersIn('<p>Lee el [Aviso de Privacidad].</p>'), []);
  });

  it('ignores scripts and styles in any case or spacing', () => {
    const html =
      '<SCRIPT>x="[FECHA]"</SCRIPT ><script type="module">y="[N]"</script\n>' +
      '<Style>a::after{content:"[PLAZO]"}</style >';
    assert.deepEqual(placeholdersIn(html), []);
  });

  it('reports each gap once', () => {
    assert.deepEqual(placeholdersIn('<p>[FECHA]</p><p>[FECHA]</p>'), ['[FECHA]']);
  });
});

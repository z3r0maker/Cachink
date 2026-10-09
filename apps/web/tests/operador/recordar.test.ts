// @vitest-environment jsdom
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

/**
 * «Recordarle su saldo» (Track N row 13): the phone prefilled, the message
 * carrying the live balance, WhatsApp opened with the text ready — the caja
 * never sends anything. Ten digits arm the link; the message can be edited
 * and restored; the copy button says so politely.
 */

vi.mock('../../src/operador/cobranza/cliente/recordar.css', () => ({
  burbuja: 'burbuja',
  campo: 'campo',
  card: 'card',
  chat: 'chat',
  error: 'error',
  head: 'head',
  hint: 'hint',
  hora: 'hora',
  icono: 'icono',
  label: 'label',
  lada: 'lada',
  mensajeHead: 'mensajeHead',
  overlay: 'overlay',
  restaurar: 'restaurar',
  tel: 'tel',
  telInput: 'telInput',
  textarea: 'textarea',
  titulo: 'titulo',
  titulos: 'titulos',
}));
vi.mock('../../src/operador/cobranza/cliente/recordar-pie.css', () => ({
  abrir: 'abrir',
  acciones: 'acciones',
  copiar: 'copiar',
  nota: 'nota',
}));
vi.mock('../../src/operador/cobranza/cliente/cliente.css', () => ({
  recordar: 'recordar',
}));
vi.mock('../../src/operador/ui/lateral.css', () => ({ close: 'close' }));
vi.mock('../../src/operador/ui/resumen.css', () => ({ eyebrow: 'eyebrow' }));
vi.mock('../../src/operador/shell/shell', () => ({
  HeaderAction: (p: { readonly children: unknown }) => createElement('div', null, p.children),
}));
vi.mock('@radix-ui/react-dialog', async () => {
  const nodo = (p: { readonly children: unknown; readonly className?: string }) =>
    createElement('div', { className: p.className }, p.children);
  const dialogo =
    (etiqueta: string) => (p: { readonly children: unknown; readonly className?: string }) =>
      createElement(
        etiqueta === 'Close' ? 'button' : 'div',
        { className: p.className },
        p.children,
      );
  return {
    Root: nodo,
    Portal: nodo,
    Overlay: dialogo('Overlay'),
    Content: dialogo('Content'),
    Title: dialogo('Title'),
    Close: dialogo('Close'),
  };
});

const { Recordar, RecordarBoton } = await import('../../src/operador/cobranza/cliente/recordar');

const MENSAJE = 'Hola María, su saldo es de $550.00. ¿La aparto?';
const COMPLETO = '55 1234 5678';

function montar(telefono = COMPLETO, mensaje = MENSAJE) {
  const onClose = vi.fn();
  render(createElement(Recordar, { nombre: 'María López', telefono, mensaje, onClose }));
  return { onClose };
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(async () => undefined) },
  });
});

afterEach(cleanup);

const enlace = (): HTMLAnchorElement =>
  screen.getByText('Abrir WhatsApp').closest('a') as HTMLAnchorElement;

describe('Recordar', () => {
  it('the phone prefilled and ten digits arm the WhatsApp link with the message', () => {
    montar();
    const input = screen.getByLabelText('Su número') as HTMLInputElement;
    assert.equal(input.value, COMPLETO);
    assert.ok(enlace().href.startsWith('https://wa.me/525512345678?text='));
    assert.ok(enlace().href.includes(encodeURIComponent(MENSAJE)));
    assert.ok(screen.queryByRole('status') === null, 'no missing-digits complaint');
  });

  it('a short phone is said so, letters never land, and the link stays unarmed', () => {
    montar('55 123');
    assert.ok(screen.getByText(/Faltan números/));
    assert.equal(enlace().getAttribute('aria-disabled'), 'true');
    assert.equal(enlace().href, '');

    const input = screen.getByLabelText('Su número');
    fireEvent.change(input, { target: { value: '55abc 1234 5678' } });
    assert.equal((input as HTMLInputElement).value, '55 1234 5678', 'only digits and spaces stay');
  });

  it('the message can be edited and restored to the original', () => {
    montar();
    const area = screen.getByLabelText('Mensaje') as HTMLTextAreaElement;
    assert.equal(screen.queryByText('Volver al mensaje original'), null);

    fireEvent.change(area, { target: { value: 'Otro mensaje' } });
    assert.ok(screen.getByText('Volver al mensaje original'));

    fireEvent.click(screen.getByText('Volver al mensaje original'));
    assert.equal((screen.getByLabelText('Mensaje') as HTMLTextAreaElement).value, MENSAJE);
    assert.equal(screen.queryByText('Volver al mensaje original'), null);
  });

  it('copying the message says so, once it lands', async () => {
    montar();
    assert.ok(screen.getByText('Copiar mensaje'));
    fireEvent.click(screen.getByText('Copiar mensaje'));
    await waitFor(() => assert.ok(screen.getByText('Copiado')));
  });

  it('the header button reports its click', () => {
    const onClick = vi.fn();
    render(createElement(RecordarBoton, { onClick }));
    fireEvent.click(screen.getByRole('button', { name: /Recordarle por WhatsApp/ }));
    assert.equal(onClick.mock.calls.length, 1);
  });
});

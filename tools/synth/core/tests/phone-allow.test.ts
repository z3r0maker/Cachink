import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { checkPhoneCommand, describePhoneCommand } from '../src/phone/allow';

/**
 * What the phone actor may ask Maestro to do: one thing a person does with a
 * phone in their hand, per call. Everything Maestro can do beyond that (open
 * a link, relaunch or wipe the app, run a script, run another flow, move the
 * GPS) is refused, so the actor cannot leave the persona's hands.
 */
const ok = (yaml: string) => {
  const r = checkPhoneCommand(yaml);
  assert.ok(r.ok, r.ok ? '' : r.reason);
  return r;
};
const refused = (yaml: string, why: RegExp) => {
  const r = checkPhoneCommand(yaml);
  assert.equal(r.ok, false, yaml);
  if (!r.ok) assert.match(r.reason, why, yaml);
};

describe('checkPhoneCommand', () => {
  it('takes a tap by visible text or by point, typing, erasing, swiping, scrolling, back and Enter', () => {
    for (const y of [
      '- tapOn: Cobrar',
      '- tapOn:\n    text: Cobrar\n    index: 1',
      '- tapOn:\n    point: 50%,80%',
      '- doubleTapOn: Refresco',
      '- longPressOn: Galletas',
      '- inputText: "100"',
      '- eraseText: 10',
      '- eraseText',
      '- swipe:\n    direction: UP',
      '- scroll',
      '- back',
      '- hideKeyboard',
      '- pressKey: Enter',
      '- pressKey: Backspace',
    ]) {
      ok(y);
    }
  });

  it('reads a bare command or a flow with the appId header, and calls a lone wait a look', () => {
    assert.equal(ok('appId: mx.xangarro.mobile\n---\n- tapOn: Cobrar').kind, 'action');
    assert.equal(ok('tapOn: Cobrar').kind, 'action');
    assert.equal(ok('- waitForAnimationToEnd').kind, 'look');
  });

  it('refuses what takes the persona out of the app or past its screen', () => {
    for (const [y, why] of [
      ['- openLink: exp+xangarro://x', /openLink/],
      ['- launchApp', /launchApp/],
      ['- clearState', /clearState/],
      ['- runScript: x.js', /runScript/],
      ['- evalScript: ${1}', /evalScript/],
      ['- runFlow: other.yaml', /runFlow/],
      ['- setLocation:\n    latitude: 1\n    longitude: 1', /setLocation/],
      ['- pressKey: Home', /Home/],
      ['- toggleAirplaneMode', /toggleAirplaneMode/],
    ] as const) {
      refused(y, why);
    }
  });

  it('refuses tapping by test id: the persona sees words and places, not the code’s names', () => {
    refused('- tapOn:\n    id: nip-enviar', /id/);
    refused('- tapOn:\n    text: Cobrar\n    id: cobrar', /id/);
  });

  it('refuses more than one action per call, so a step is one thing done', () => {
    refused('- tapOn: Refresco\n- tapOn: Cobrar', /one/);
    ok('- tapOn: Cobrar\n- waitForAnimationToEnd');
  });

  it('refuses an item that holds two commands, and says where the option goes (seen in a run)', () => {
    refused('- tapOn: "Cobrar"\n  index: 0', /one command per item.*under tapOn/);
  });

  it('refuses a tap aimed at bare pixel numbers, and says how to aim at a point (seen in a run)', () => {
    refused('- tapOn: 897,1578', /point: 50%,80%/);
    refused('- tapOn: 25%,60%', /point: 50%,80%/);
    ok('- tapOn: "2,500"'.replace('2,500', 'Cobrar $1,500'));
  });

  it('refuses YAML it cannot read, and an empty call', () => {
    refused('- tapOn: [', /YAML/);
    refused('', /nothing/);
  });
});

describe('describePhoneCommand', () => {
  it('says what was done in words', () => {
    assert.equal(describePhoneCommand('- tapOn: Cobrar'), 'tap «Cobrar»');
    assert.equal(describePhoneCommand('- tapOn:\n    point: 50%,80%'), 'tap at 50%,80%');
    assert.equal(describePhoneCommand('- inputText: "100"'), 'type «100»');
    assert.equal(describePhoneCommand('- swipe:\n    direction: UP'), 'swipe UP');
    assert.equal(describePhoneCommand('- back'), 'go back');
    assert.equal(describePhoneCommand('- pressKey: Enter'), 'press «Enter»');
  });
});

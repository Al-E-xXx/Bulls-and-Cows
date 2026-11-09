import { MAX_CODE_LENGTH, MIN_CODE_LENGTH } from '../game/constants.js';
import type { NumericBase, RoundSettings } from '../game/types.js';
import { el } from './dom.js';

export const BASE_CAPTIONS: Readonly<Record<NumericBase, string>> = {
  2: 'Двоичная',
  8: 'Восьмеричная',
  10: 'Десятичная',
  16: 'Шестнадцатеричная',
};

export const NUMERIC_BASES: readonly NumericBase[] = [2, 8, 10, 16];

const isNumericBase = (value: number): value is NumericBase =>
  value === 2 || value === 8 || value === 10 || value === 16;

const lengthsInRange = (from: number, to: number): readonly number[] =>
  from > to ? [] : [from, ...lengthsInRange(from + 1, to)];

const createOption = (
  name: string,
  value: number,
  caption: string,
  checked: boolean,
): HTMLLabelElement => {
  const input = el('input');
  input.type = 'radio';
  input.name = name;
  input.value = String(value);
  input.checked = checked;
  const label = el('label', 'settings__option', caption);
  label.prepend(input);
  return label;
};

const readSettings = (form: HTMLFormElement): RoundSettings | null => {
  const lengthInput = form.querySelector<HTMLInputElement>(
    'input[name="code-length"]:checked',
  );
  const baseInput = form.querySelector<HTMLInputElement>(
    'input[name="code-base"]:checked',
  );
  if (lengthInput === null || baseInput === null) {
    return null;
  }
  const length = Number(lengthInput.value);
  const base = Number(baseInput.value);
  if (!Number.isInteger(length) || !isNumericBase(base)) {
    return null;
  }
  return { length, base };
};

export const createSettingsScreen = (
  initial: RoundSettings,
  onPlay: (settings: RoundSettings) => void,
): HTMLElement => {
  const lengthGroup = el('fieldset', 'settings__group');
  lengthGroup.append(el('legend', '', 'Длина секретного кода'));
  lengthsInRange(MIN_CODE_LENGTH, MAX_CODE_LENGTH).forEach(length => {
    lengthGroup.append(
      createOption(
        'code-length',
        length,
        String(length),
        length === initial.length,
      ),
    );
  });

  const baseGroup = el('fieldset', 'settings__group');
  baseGroup.append(el('legend', '', 'Система счисления'));
  NUMERIC_BASES.forEach(base => {
    baseGroup.append(
      createOption(
        'code-base',
        base,
        BASE_CAPTIONS[base],
        base === initial.base,
      ),
    );
  });

  const playButton = el('button', 'settings__play', 'Играть');
  playButton.type = 'submit';

  const form = el('form', 'settings');
  form.append(lengthGroup, baseGroup, playButton);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const next = readSettings(form);
    if (next !== null) {
      onPlay(next);
    }
  });
  return form;
};

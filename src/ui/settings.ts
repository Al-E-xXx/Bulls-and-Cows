import { MIN_CODE_LENGTH, maxCodeLengthForBase } from '../game/constants.js';
import { countPossibleSecrets } from '../game/counting.js';
import type { NumericBase, RoundSettings } from '../game/types.js';
import { clearNode, el } from './dom.js';

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

const clampLength = (length: number, base: NumericBase): number =>
  Math.min(length, maxCodeLengthForBase(base));

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

export const createSettingsScreen = (
  initial: RoundSettings,
  onPlay: (settings: RoundSettings) => void,
): HTMLElement => {
  let current: RoundSettings = {
    length: clampLength(initial.length, initial.base),
    base: initial.base,
  };

  const lengthGroup = el('fieldset', 'settings__group');

  const renderLengths = (): void => {
    clearNode(lengthGroup);
    lengthGroup.append(el('legend', '', 'Длина секретного кода'));
    lengthsInRange(MIN_CODE_LENGTH, maxCodeLengthForBase(current.base)).forEach(
      length => {
        lengthGroup.append(
          createOption(
            'code-length',
            length,
            String(length),
            length === current.length,
          ),
        );
      },
    );
  };

  const baseGroup = el('fieldset', 'settings__group');
  baseGroup.append(el('legend', '', 'Система счисления'));
  NUMERIC_BASES.forEach(base => {
    baseGroup.append(
      createOption(
        'code-base',
        base,
        BASE_CAPTIONS[base],
        base === current.base,
      ),
    );
  });

  const countLine = el('p', 'settings__count');

  const renderCount = (): void => {
    const count = countPossibleSecrets(current.length, current.base);
    countLine.textContent = `Возможных вариантов кода: ${count.toLocaleString(
      'ru-RU',
    )}`;
  };

  const playButton = el('button', 'settings__play', 'Играть');
  playButton.type = 'submit';

  const form = el('form', 'settings');
  form.append(lengthGroup, baseGroup, countLine, playButton);

  form.addEventListener('change', event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const value = Number(target.value);
    if (target.name === 'code-base' && isNumericBase(value)) {
      current = { length: clampLength(current.length, value), base: value };
      renderLengths();
    } else if (target.name === 'code-length' && Number.isInteger(value)) {
      current = { ...current, length: value };
    } else {
      return;
    }
    renderCount();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    onPlay(current);
  });

  renderLengths();
  renderCount();
  return form;
};

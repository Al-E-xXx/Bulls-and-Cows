import { createDigitValidator } from '../game/validate.js';
import type { Code, GameState, NumericBase } from '../game/types.js';
import { el } from './dom.js';
import { BASE_CAPTIONS } from './settings.js';

const sanitizeGuess = (value: string, base: NumericBase, max: number): Code => {
  const validator = createDigitValidator(base);
  const kept: string[] = [];
  for (const symbol of value) {
    const digit = validator(symbol);
    if (digit !== undefined && !kept.includes(digit)) {
      kept.push(digit);
    }
    if (kept.length === max) {
      break;
    }
  }
  return kept.join('');
};

export const createGameScreen = (state: GameState): HTMLElement => {
  const { length, base } = state.settings;
  const section = el('section', 'game');

  const info = el(
    'p',
    'game__info',
    `Длина кода: ${length}, ` + `система счисления: ${BASE_CAPTIONS[base]}`,
  );

  let guess: Code = '';

  const input = el('input', 'game__input');
  input.type = 'text';
  input.maxLength = length;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Ваша попытка');

  input.addEventListener('input', () => {
    guess = sanitizeGuess(input.value, base, length);
    input.value = guess;
  });

  const submit = el('button', 'game__submit', 'Проверить');
  submit.type = 'submit';

  const form = el('form', 'game__form');
  form.append(input, submit);

  section.append(info, form);
  return section;
};

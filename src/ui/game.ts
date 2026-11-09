import { createDigitValidator, isValidGuess } from '../game/validate.js';
import type { Code, NumericBase, RoundSettings } from '../game/types.js';
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

export const createGameScreen = (
  settings: RoundSettings,
  onGuess: (guess: Code) => void,
): HTMLElement => {
  const { length, base } = settings;
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

  const error = el('p', 'game__error');
  error.hidden = true;

  const clearError = (): void => {
    error.textContent = '';
    error.hidden = true;
  };

  input.addEventListener('input', () => {
    guess = sanitizeGuess(input.value, base, length);
    input.value = guess;
    clearError();
  });

  const submit = el('button', 'game__submit', 'Проверить');
  submit.type = 'submit';

  const form = el('form', 'game__form');
  form.append(input, submit);

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!isValidGuess(guess, length, base)) {
      error.textContent =
        'Нужен код из разных допустимых символов полной длины';
      error.hidden = false;
      return;
    }
    clearError();
    guess = '';
    input.value = '';
    onGuess(guess);
  });

  section.append(info, form, error);
  return section;
};

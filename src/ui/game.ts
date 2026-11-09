import { createDigitValidator, isValidGuess } from '../game/validate.js';
import type { Code, NumericBase, RoundState } from '../game/types.js';
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

const createHistoryItem = (
  attempt: number,
  guess: Code,
  bulls: number,
  cows: number,
): HTMLLIElement =>
  el(
    'li',
    'game__attempt',
    `Попытка ${attempt}: ${guess} — быков: ${bulls}, коров: ${cows}`,
  );

export const createGameScreen = (
  state: RoundState,
  onGuess: (guess: Code) => void,
): HTMLElement => {
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
    const current = guess;
    guess = '';
    input.value = '';
    onGuess(current);
  });

  section.append(info, form, error);

  if (state.history.length > 0) {
    const heading = el('h2', 'game__history-title', 'История попыток');
    const list = el('ul', 'game__history');
    state.history.forEach(entry => {
      list.append(
        createHistoryItem(
          entry.attempt,
          entry.guess,
          entry.evaluation.bulls,
          entry.evaluation.cows,
        ),
      );
    });
    section.append(heading, list);
  }

  return section;
};

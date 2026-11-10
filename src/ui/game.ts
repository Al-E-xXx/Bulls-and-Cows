import { createDigitValidator, isValidGuess } from '../game/validate.js';
import { elapsedMs, formatDuration } from '../game/time.js';
import type {
  Code,
  HistoryEntry,
  NumericBase,
  RoundState,
} from '../game/types.js';
import { el, scrollToEnd } from './dom.js';
import { BASE_CAPTIONS } from './settings.js';

const INVALID_GUESS_MESSAGE =
  'Нужен код из разных допустимых символов полной длины';
const DUPLICATE_MESSAGE = 'Такая попытка уже была';

const hasDuplicate = (history: readonly HistoryEntry[], guess: Code): boolean =>
  history.some(entry => entry.guess === guess);

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

const createGuessForm = (
  state: RoundState,
  onGuess: (guess: Code) => void,
): { form: HTMLFormElement; error: HTMLParagraphElement } => {
  const { length, base } = state.settings;

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

  const showError = (message: string): void => {
    error.textContent = message;
    error.hidden = false;
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
      showError(INVALID_GUESS_MESSAGE);
      return;
    }
    if (hasDuplicate(state.history, guess)) {
      showError(DUPLICATE_MESSAGE);
      return;
    }
    clearError();
    const current = guess;
    guess = '';
    input.value = '';
    onGuess(current);
  });

  return { form, error };
};

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

  const timer = el('p', 'game__timer');

  const showTime = (): void => {
    const finished = state.status === 'won' ? state.finishedAt : Date.now();
    timer.textContent = `Время: ${formatDuration(
      elapsedMs(state.startedAt, finished),
    )}`;
  };
  showTime();

  if (state.status === 'playing') {
    const timerId = setInterval(() => {
      if (!document.contains(section)) {
        clearInterval(timerId);
        return;
      }
      showTime();
    }, 1_000);
  }

  if (state.status === 'won') {
    const win = el(
      'p',
      'game__win',
      `Победа! Загаданный код: ${state.secret}. ` +
        `Попыток: ${state.history.length}. ` +
        `Время: ${formatDuration(elapsedMs(state.startedAt, state.finishedAt))}`,
    );
    section.append(info, timer, win);
  } else {
    const guessForm = createGuessForm(state, onGuess);
    section.append(info, timer, guessForm.form, guessForm.error);
  }

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
    queueMicrotask(() => {
      scrollToEnd(list);
    });
  }

  return section;
};

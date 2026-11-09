import type { GameState } from '../game/types.js';
import { el } from './dom.js';
import { BASE_CAPTIONS } from './settings.js';

export const createGameScreen = (state: GameState): HTMLElement => {
  const section = el('section', 'game');

  const info = el(
    'p',
    'game__info',
    `Длина кода: ${state.settings.length}, ` +
      `система счисления: ${BASE_CAPTIONS[state.settings.base]}`,
  );

  section.append(info);
  return section;
};

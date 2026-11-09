import { evaluateGuess } from './game/evaluate.js';
import { generateSecret } from './game/secret.js';
import { registerAttempt, startRound } from './game/state.js';
import type { Code, GameState, RoundSettings } from './game/types.js';
import { clearNode, el } from './ui/dom.js';
import { createGameScreen } from './ui/game.js';
import { createSettingsScreen } from './ui/settings.js';

const DEFAULT_SETTINGS: RoundSettings = { length: 4, base: 10 };

let gameState: GameState = { status: 'idle', settings: DEFAULT_SETTINGS };

const main = el('main', 'app__main');

const createHeader = (): HTMLElement => {
  const header = el('header', 'app__header');
  header.append(el('h1', 'app__title', 'Быки и коровы'));
  return header;
};

const isPlaying = (
  state: GameState,
): state is Extract<GameState, { status: 'playing' }> =>
  state.status === 'playing';

const render = (): void => {
  clearNode(main);
  if (gameState.status === 'idle') {
    main.append(createSettingsScreen(gameState.settings, handlePlay));
  } else {
    main.append(createGameScreen(gameState.settings, handleGuess));
  }
};

const handlePlay = (settings: RoundSettings): void => {
  gameState = startRound(
    settings,
    generateSecret(settings.length, settings.base, Math.random),
    Date.now(),
  );
  render();
};

const handleGuess = (guess: Code): void => {
  if (!isPlaying(gameState)) {
    return;
  }
  gameState = registerAttempt(
    gameState,
    guess,
    evaluateGuess(gameState.secret, guess),
    Date.now(),
  );
  render();
};

document.body.append(createHeader(), main);

render();

export {};

import { evaluateGuess } from './game/evaluate.js';
import { addRecord } from './game/records.js';
import { generateSecret } from './game/secret.js';
import { registerAttempt, startRound } from './game/state.js';
import { elapsedMs } from './game/time.js';
import type {
  Code,
  GameState,
  RecordEntry,
  RecordsTableKey,
  RoundSettings,
  RoundState,
} from './game/types.js';
import {
  loadRecords,
  saveRecords,
  type KeyValueStore,
} from './storage/storage.js';
import { clearNode, el } from './ui/dom.js';
import { createGameScreen } from './ui/game.js';
import { createRecordsSection } from './ui/records.js';
import { createSettingsScreen } from './ui/settings.js';

const DEFAULT_SETTINGS: RoundSettings = { length: 4, base: 10 };

const recordsStore: KeyValueStore = window.localStorage;

let gameState: GameState = { status: 'idle', settings: DEFAULT_SETTINGS };

const main = el('main', 'app__main');

const createHeader = (): HTMLElement => {
  const header = el('header', 'app__header');
  header.append(el('h1', 'app__title', 'Быки и коровы'));
  return header;
};

const isRound = (state: GameState): state is RoundState =>
  state.status !== 'idle';

const persistWinRecord = (state: RoundState): void => {
  if (state.status !== 'won') {
    return;
  }
  const table: RecordsTableKey = {
    length: state.settings.length,
    base: state.settings.base,
  };
  const record: RecordEntry = {
    ...table,
    date: new Date(state.finishedAt).toISOString(),
    attempts: state.history.length,
    timeMs: elapsedMs(state.startedAt, state.finishedAt),
  };
  saveRecords(
    recordsStore,
    table,
    addRecord(loadRecords(recordsStore, table), record),
  );
};

const render = (): void => {
  clearNode(main);
  if (gameState.status === 'idle') {
    main.append(createSettingsScreen(gameState.settings, handlePlay));
  } else {
    main.append(
      createGameScreen(gameState, handleGuess),
      createRecordsSection(
        gameState.settings,
        loadRecords(recordsStore, gameState.settings),
      ),
    );
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
  if (!isRound(gameState) || gameState.status !== 'playing') {
    return;
  }
  gameState = registerAttempt(
    gameState,
    guess,
    evaluateGuess(gameState.secret, guess),
    Date.now(),
  );
  if (gameState.status === 'won') {
    persistWinRecord(gameState);
  }
  render();
};

document.body.append(createHeader(), main);

render();

export {};

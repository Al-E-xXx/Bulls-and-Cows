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
  collectAllRecords,
  loadRecords,
  saveRecords,
  type KeyValueStore,
} from './storage/storage.js';
import { clearNode, el } from './ui/dom.js';
import { createGameScreen } from './ui/game.js';
import { createMenu } from './ui/menu.js';
import { createModal, type ModalController } from './ui/modal.js';
import { createRecordsPanel } from './ui/records.js';
import { createSettingsScreen } from './ui/settings.js';

const DEFAULT_SETTINGS: RoundSettings = { length: 4, base: 10 };

const recordsStore: KeyValueStore = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  getKeys: () => Object.keys(window.localStorage),
};

let gameState: GameState = { status: 'idle', settings: DEFAULT_SETTINGS };

const header = el('header', 'app__header');
const main = el('main', 'app__main');

let settingsForm: HTMLFormElement | undefined;
let currentModal: ModalController | undefined;

const isRound = (state: GameState): state is RoundState =>
  state.status !== 'idle';

const closeModal = (): void => {
  currentModal?.element.remove();
  currentModal = undefined;
};

const openModal = (
  title: string,
  body: readonly Node[],
  onClose: () => void,
): void => {
  closeModal();
  currentModal = createModal({ title, body, onClose });
  document.body.append(currentModal.element);
  currentModal.focus();
};

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
  clearNode(header);
  clearNode(main);
  settingsForm = undefined;
  header.append(
    createMenu(isRound(gameState), {
      onPlay: handleMenuPlay,
      onNewGame: handleNewGame,
      onRecords: () => openRecordsModal(),
    }),
  );
  if (gameState.status === 'idle') {
    settingsForm = createSettingsScreen(gameState.settings, handlePlay);
    main.append(settingsForm);
  } else {
    main.append(createGameScreen(gameState, handleGuess));
  }
};

const resetToIdle = (): void => {
  closeModal();
  gameState = { status: 'idle', settings: gameState.settings };
  render();
};

const handlePlay = (settings: RoundSettings): void => {
  gameState = startRound(
    settings,
    generateSecret(settings.length, settings.base, Math.random),
    Date.now(),
  );
  render();
};

const handleMenuPlay = (): void => {
  settingsForm?.requestSubmit();
};

const handleNewGame = (): void => {
  if (gameState.status !== 'playing') {
    resetToIdle();
    return;
  }
  const yes = el('button', 'modal__primary', 'Да, новая игра');
  yes.type = 'button';
  yes.addEventListener('click', resetToIdle);
  const no = el('button', 'modal__secondary', 'Отмена');
  no.type = 'button';
  no.addEventListener('click', closeModal);
  const actions = el('div', 'modal__actions');
  actions.append(yes, no);
  openModal(
    'Раунд будет сброшен',
    [
      el('p', 'modal__text', 'Текущая игра не сохранится. Начать новую?'),
      actions,
    ],
    closeModal,
  );
};

const openRecordsModal = (preferred: RecordsTableKey | null = null): void => {
  openModal(
    'Рекорды',
    [createRecordsPanel(collectAllRecords(recordsStore), preferred)],
    closeModal,
  );
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
  if (gameState.status === 'won') {
    openRecordsModal(gameState.settings);
  }
};

document.body.append(header, main);

render();

export {};

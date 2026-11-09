import type { RoundSettings } from './game/types.js';
import { clearNode, el } from './ui/dom.js';
import { createSettingsScreen } from './ui/settings.js';

const DEFAULT_SETTINGS: RoundSettings = { length: 4, base: 10 };

let settings: RoundSettings = DEFAULT_SETTINGS;

const main = el('main', 'app__main');

const createHeader = (): HTMLElement => {
  const header = el('header', 'app__header');
  header.append(el('h1', 'app__title', 'Быки и коровы'));
  return header;
};

const handlePlay = (next: RoundSettings): void => {
  settings = next;
};

const renderSettings = (): void => {
  clearNode(main);
  main.append(createSettingsScreen(settings, handlePlay));
};

document.body.append(createHeader(), main);

renderSettings();

export {};

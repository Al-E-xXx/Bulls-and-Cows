import { el } from './dom.js';

export interface MenuHandlers {
  readonly onPlay: () => void;
  readonly onNewGame: () => void;
  readonly onRecords: () => void;
}

const createMenuItem = (
  className: string,
  caption: string,
  onClick: () => void,
  disabled: boolean,
): HTMLButtonElement => {
  const button = el('button', className, caption);
  button.type = 'button';
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
};

export const createMenu = (
  roundActive: boolean,
  handlers: MenuHandlers,
): HTMLElement => {
  const nav = el('nav', 'menu');
  nav.append(
    createMenuItem('menu__play', 'Играть', handlers.onPlay, roundActive),
    createMenuItem('menu__new', 'Новая игра', handlers.onNewGame, !roundActive),
    createMenuItem('menu__records', 'Рекорды', handlers.onRecords, false),
  );
  return nav;
};
